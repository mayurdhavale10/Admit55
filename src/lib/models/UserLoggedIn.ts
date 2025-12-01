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

  // NEW: internal notes attached to the user
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

  // Check if user already exists
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
      // NEW: start with an empty notes array
      notes: [],
    };

    const result = await col.insertOne(doc);
    return {
      ...doc,
      _id: result.insertedId,
    };
  }

  // Existing user → increment loginCount & update timestamps / details
  const updatedLoginCount = (existing.loginCount || 0) + 1;

  await col.updateOne(
    { _id: existing._id },
    {
      $set: {
        name: name ?? existing.name,
        image: image ?? existing.image,
        role: role || existing.role || "user",
        lastLogin: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: existing.createdAt || now,
        // If for some reason we ever hit setOnInsert on an existing-like case,
        // we still default notes to an empty array.
        notes: existing.notes ?? [],
      },
      $inc: {
        loginCount: 1,
      },
    }
  );

  // Return the latest version
  const refreshed = await col.findOne({ _id: existing._id });
  if (!refreshed) {
    // Should not happen, but just in case
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
