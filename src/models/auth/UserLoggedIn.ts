// src/lib/models/UserLoggedIn.ts
import { ObjectId, type Document } from "mongodb";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";

export type UserRole = "admin" | "user";
export type UserPlan = "free" | "pro";

// 1) TypeScript interface for documents in "logged_in_users"
export interface LoggedInUser extends Document {
  _id?: ObjectId;

  email: string;
  name?: string;
  image?: string;

  // ✅ Auth/Entitlements
  role: UserRole;      // "admin" | "user"
  plan: UserPlan;      // "free" | "pro"
  planUpdatedAt?: Date;

  loginCount: number;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;

  // Profile fields
  headline?: string | null;      // e.g. "Future MBA Applicant"
  targetIntake?: string | null;  // e.g. "Fall 2026"
  myGoal?: string | null;
  mentorNotice?: string | null;

  // Internal notes (for admin)
  notes?: {
    text: string;
    createdAt: Date;
  }[];
}

function normalizeRole(x: any): UserRole {
  return x === "admin" ? "admin" : "user";
}

function normalizePlan(x: any): UserPlan {
  return x === "pro" ? "pro" : "free";
}

// 2) Upsert helper: call this every time someone logs in
export async function upsertLoggedInUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
  role?: UserRole; // default "user"
  plan?: UserPlan; // default "free"
}): Promise<LoggedInUser> {
  const { email, name, image } = params;

  if (!email) {
    throw new Error("[UserLoggedIn] upsertLoggedInUser called without email");
  }

  const col = await getLoggedInUsersCollection<LoggedInUser>();
  const now = new Date();

  const existing = await col.findOne({ email });

  if (!existing) {
    // New user
    const role = normalizeRole(params.role);
    const plan = normalizePlan(params.plan);

    const doc: LoggedInUser = {
      email,
      name: name || undefined,
      image: image || undefined,

      role,
      plan,
      planUpdatedAt: now,

      loginCount: 1,
      lastLogin: now,
      createdAt: now,
      updatedAt: now,

      headline: "Future MBA Applicant",
      targetIntake: null,
      myGoal: null,
      mentorNotice: "Important notice from your mentor will appear here.",
      notes: [],
    };

    const result = await col.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  // Existing user → update (preserve role/plan if not passed)
  const nextRole = normalizeRole(params.role ?? existing.role);
  const nextPlan = normalizePlan(params.plan ?? existing.plan);

  const planChanged = nextPlan !== normalizePlan(existing.plan);

  await col.updateOne(
    { _id: existing._id },
    {
      $set: {
        name: name ?? existing.name,
        image: image ?? existing.image,

        role: nextRole,
        plan: nextPlan,
        ...(planChanged ? { planUpdatedAt: now } : {}),

        lastLogin: now,
        updatedAt: now,

        // preserve existing profile fields if present
        headline: existing.headline ?? "Future MBA Applicant",
        targetIntake: existing.targetIntake ?? null,
        myGoal: existing.myGoal ?? null,
        mentorNotice:
          existing.mentorNotice ?? "Important notice from your mentor will appear here.",
      },
      $inc: { loginCount: 1 },
      $setOnInsert: { createdAt: existing.createdAt ?? now },
    }
  );

  const refreshed = await col.findOne({ _id: existing._id });
  if (!refreshed) {
    throw new Error("[UserLoggedIn] Failed to reload user after update");
  }

  // Ensure role/plan always exist in returned object (older docs safety)
  return {
    ...refreshed,
    role: normalizeRole(refreshed.role),
    plan: normalizePlan(refreshed.plan),
  };
}

// 3) Fetch list for admin panel ("people who logged in")
export async function getLoggedInUsers(limit = 100): Promise<LoggedInUser[]> {
  const col = await getLoggedInUsersCollection<LoggedInUser>();
  const users = await col
    .find({})
    .sort({ lastLogin: -1 })
    .limit(limit)
    .toArray();

  // normalize older docs
  return users.map((u) => ({
    ...u,
    role: normalizeRole(u.role),
    plan: normalizePlan(u.plan),
  }));
}

// 4) Get single user by email
export async function getLoggedInUserByEmail(email: string): Promise<LoggedInUser | null> {
  const col = await getLoggedInUsersCollection<LoggedInUser>();
  const user = await col.findOne({ email });
  if (!user) return null;
  return { ...user, role: normalizeRole(user.role), plan: normalizePlan(user.plan) };
}

/* -------------------------------------------------------
   Admin helpers (used by Admin Panel APIs)
------------------------------------------------------- */

export async function setUserPlanByEmail(email: string, plan: UserPlan): Promise<void> {
  const col = await getLoggedInUsersCollection<LoggedInUser>();
  const now = new Date();
  await col.updateOne(
    { email },
    {
      $set: { plan: normalizePlan(plan), planUpdatedAt: now, updatedAt: now },
      $setOnInsert: {
        email,
        role: "user",
        loginCount: 0,
        lastLogin: now,
        createdAt: now,
      },
    },
    { upsert: true }
  );
}

export async function setUserRoleByEmail(email: string, role: UserRole): Promise<void> {
  const col = await getLoggedInUsersCollection<LoggedInUser>();
  const now = new Date();
  await col.updateOne(
    { email },
    {
      $set: { role: normalizeRole(role), updatedAt: now },
      $setOnInsert: {
        email,
        plan: "free",
        loginCount: 0,
        lastLogin: now,
        createdAt: now,
      },
    },
    { upsert: true }
  );
}
