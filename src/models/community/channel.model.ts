// src/models/community/channel.model.ts
import { Collection, ObjectId } from "mongodb";
import { connectDB } from "@src/lib/db/loggedinuser/connectDB"; // ✅ use connectDB, not getLoggedInUsersCollection

// --------------------
// Type definitions
// --------------------

export interface CommunityChannel {
  _id?: ObjectId;

  // URL-safe slug, e.g. "gmat", "isb-applicants"
  slug: string;

  // Display name, e.g. "GMAT Prep", "ISB Applicants 2026"
  name: string;

  // Short description shown in UI
  description?: string;

  // If true → only admins can post (future)
  isLocked: boolean;

  // Soft-delete flag
  isDeleted: boolean;

  // Who created this channel (optional for now)
  createdByUserId?: ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

// --------------------
// Internal helper
// --------------------

async function getChannelCollection(): Promise<Collection<CommunityChannel>> {
  const db = await connectDB(); // ✅ this returns Db
  return db.collection<CommunityChannel>("community_channels");
}

// --------------------
// CRUD helpers
// --------------------

/**
 * Create a new community channel.
 */
export async function createChannel(input: {
  slug: string;
  name: string;
  description?: string;
  createdByUserId?: string | ObjectId | null;
}): Promise<CommunityChannel> {
  const col = await getChannelCollection();

  const now = new Date();
  const doc: CommunityChannel = {
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    description: input.description?.trim() || "",
    isLocked: false,
    isDeleted: false,
    createdByUserId: input.createdByUserId
      ? new ObjectId(input.createdByUserId)
      : null,
    createdAt: now,
    updatedAt: now,
  };

  const existing = await col.findOne({
    slug: doc.slug,
    isDeleted: false,
  });

  if (existing) {
    throw new Error(`Channel with slug "${doc.slug}" already exists`);
  }

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Return all non-deleted channels (sorted by createdAt).
 */
export async function getAllActiveChannels(): Promise<CommunityChannel[]> {
  const col = await getChannelCollection();
  return col.find({ isDeleted: false }).sort({ createdAt: 1 }).toArray();
}

/**
 * Get a single channel by slug.
 */
export async function getChannelBySlug(
  slug: string
): Promise<CommunityChannel | null> {
  const col = await getChannelCollection();
  return col.findOne({
    slug: slug.trim().toLowerCase(),
    isDeleted: false,
  });
}

/**
 * Get a single channel by _id.
 */
export async function getChannelById(
  id: string | ObjectId
): Promise<CommunityChannel | null> {
  const col = await getChannelCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  return col.findOne({
    _id,
    isDeleted: false,
  });
}

/**
 * Soft delete a channel (mark isDeleted = true).
 */
export async function softDeleteChannel(
  id: string | ObjectId
): Promise<void> {
  const col = await getChannelCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  await col.updateOne(
    { _id },
    {
      $set: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Update channel name/description (admin only in API layer).
 */
export async function updateChannelDetails(params: {
  id: string | ObjectId;
  name?: string;
  description?: string;
  isLocked?: boolean;
}): Promise<void> {
  const { id, name, description, isLocked } = params;
  const col = await getChannelCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  const update: Partial<CommunityChannel> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (typeof name === "string") {
    update.name = name.trim();
  }
  if (typeof description === "string") {
    update.description = description.trim();
  }
  if (typeof isLocked === "boolean") {
    update.isLocked = isLocked;
  }

  await col.updateOne(
    { _id, isDeleted: false },
    { $set: update }
  );
}

// --------------------
// Default channels seeding (optional)
// --------------------

/**
 * Call this once at startup (or from an admin route)
 * to ensure some default rooms exist.
 */
export async function ensureDefaultChannels() {
  const col = await getChannelCollection();

  const defaults: Array<
    Pick<CommunityChannel, "slug" | "name" | "description">
  > = [
    {
      slug: "gmat",
      name: "GMAT Prep",
      description: "Discuss GMAT strategy, resources, and score improvement.",
    },
    {
      slug: "isb-applicants",
      name: "ISB Applicants",
      description: "Connect with fellow ISB aspirants and share experiences.",
    },
    {
      slug: "career-switch",
      name: "Career Switchers",
      description:
        "For engineers, consultants, and others planning a career pivot.",
    },
  ];

  for (const def of defaults) {
    const existing = await col.findOne({
      slug: def.slug,
      isDeleted: false,
    });

    if (!existing) {
      const now = new Date();
      const doc: CommunityChannel = {
        slug: def.slug,
        name: def.name,
        description: def.description,
        isLocked: false,
        isDeleted: false,
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
    }
  }
}
