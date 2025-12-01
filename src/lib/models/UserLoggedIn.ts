// src/lib/models/UserLoggedIn.ts
import { ObjectId, type Document } from "mongodb";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";

// 1) TypeScript interface for documents in "logged_in_users"
export interface LoggedInUser extends Document {
  _id?: ObjectId;
  email: string;
  name?: string;
  image?: string;
  role: "admin" | "user";
  loginCount: number;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;

  // NEW PROFILE FIELDS
  headline?: string | null;        // e.g. "Future MBA Applicant"
  targetIntake?: string | null;    // e.g. "Fall 2026"

  // Internal notes (for admin)
  notes?: {
    text: string;
    createdAt: Date;
  }[];
}

// 2) Upsert helper: call this every time someone logs in
export async function upsertLoggedInUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
  role?: "admin" | "user"; // default "user"
}): Promise<LoggedInUser> {
  const { email, name, image, role } = params;

  if (!email) {
    throw new Error("[UserLoggedIn] upsertLoggedInUser called without email");
  }

  const col = await getLoggedInUsersCollection<LoggedInUser>();
  const now = new Date();

  const existing = await col.findOne({ email });

  if (!existing) {
    // New user
    const doc: LoggedInUser = {
      email,
      name: name || undefined,
      image: image || undefined,
      role: role || "user",
      loginCount: 1,
      lastLogin: now,
      createdAt: now,
      updatedAt: now,

      // NEW INITIAL VALUES
      headline: "Future MBA Applicant",
      targetIntake: null, // user will fill later

      notes: [],
    };

    const result = await col.insertOne(doc);
    return {
      ...doc,
      _id: result.insertedId,
    };
  }

  // Existing user → update
  await col.updateOne(
    { _id: existing._id },
    {
      $set: {
        name: name ?? existing.name,
        image: image ?? existing.image,
        role: role || existing.role || "user",
        lastLogin: now,
        updatedAt: now,

        // preserve existing headline/intake if present
        headline: existing.headline ?? "Future MBA Applicant",
        targetIntake: existing.targetIntake ?? null,
      },
      $inc: { loginCount: 1 },
    }
  );

  const refreshed = await col.findOne({ _id: existing._id });
  if (!refreshed) {
    throw new Error("[UserLoggedIn] Failed to reload user after update");
  }

  return refreshed;
}

// 3) Optional: fetch list for admin panel ("people who logged in")
export async function getLoggedInUsers(limit = 100): Promise<LoggedInUser[]> {
  const col = await getLoggedInUsersCollection<LoggedInUser>();
  return col
    .find({})
    .sort({ lastLogin: -1 })
    .limit(limit)
    .toArray();
}

// 4) Optional: get single user by email
export async function getLoggedInUserByEmail(
  email: string
): Promise<LoggedInUser | null> {
  const col = await getLoggedInUsersCollection<LoggedInUser>();
  return col.findOne({ email });
}
