// src/models/community/post.model.ts
import { Collection, ObjectId } from "mongodb";
import { connectDB } from "@src/lib/db/loggedinuser/connectDB"; // ✅ use connectDB

export interface CommunityPost {
  _id?: ObjectId;

  title: string;
  body: string;

  // optional image for the post
  imageUrl?: string | null;

  // relations
  authorId: ObjectId;
  channelId: ObjectId;

  // meta (existing)
  likeCount: number;
  commentCount: number;

  // ✅ NEW: voting fields
  upvotes: number;
  downvotes: number;
  /**
   * Simple MVP: list of userIds (string) who have already voted
   * so they cannot vote twice.
   * (Later you can split into upVoters / downVoters or a separate collection.)
   */
  voters: string[];

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------
// Internal helper
// --------------------

async function getPostCollection(): Promise<Collection<CommunityPost>> {
  const db = await connectDB(); // ✅ returns Db
  return db.collection<CommunityPost>("community_posts");
}

// --------------------
// CRUD helpers
// --------------------

/**
 * Create a new post in a channel.
 */
export async function createPost(input: {
  title: string;
  body: string;
  authorId: string | ObjectId;
  channelId: string | ObjectId;
  imageUrl?: string | null;
}): Promise<CommunityPost> {
  const col = await getPostCollection();
  const now = new Date();

  const doc: CommunityPost = {
    title: input.title.trim(),
    body: input.body.trim(),
    imageUrl: input.imageUrl ?? null,
    authorId:
      typeof input.authorId === "string"
        ? new ObjectId(input.authorId)
        : input.authorId,
    channelId:
      typeof input.channelId === "string"
        ? new ObjectId(input.channelId)
        : input.channelId,

    likeCount: 0,
    commentCount: 0,

    // ✅ NEW voting fields
    upvotes: 0,
    downvotes: 0,
    voters: [],

    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Get a single post by its ID.
 */
export async function getPostById(
  id: string | ObjectId
): Promise<CommunityPost | null> {
  const col = await getPostCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  return col.findOne({ _id, isDeleted: false });
}

/**
 * Fetch paginated posts for a given channel.
 * (Newest first)
 */
export async function getPostsByChannel(params: {
  channelId: string | ObjectId;
  limit?: number;
  skip?: number;
}): Promise<CommunityPost[]> {
  const { channelId, limit = 20, skip = 0 } = params;

  const col = await getPostCollection();
  const chanId =
    typeof channelId === "string" ? new ObjectId(channelId) : channelId;

  return col
    .find({ channelId: chanId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

/**
 * Fetch recent posts across all channels (e.g. for "Latest" tab).
 */
export async function getRecentPosts(limit = 20): Promise<CommunityPost[]> {
  const col = await getPostCollection();
  return col
    .find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Soft delete a post (admin or author in API layer).
 */
export async function softDeletePost(
  id: string | ObjectId
): Promise<void> {
  const col = await getPostCollection();
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
 * Update title/body/image (only allowed for author or admin in API layer).
 */
export async function updatePost(params: {
  id: string | ObjectId;
  title?: string;
  body?: string;
  imageUrl?: string | null;
}): Promise<void> {
  const { id, title, body, imageUrl } = params;
  const col = await getPostCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  const update: Partial<CommunityPost> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (typeof title === "string") update.title = title.trim();
  if (typeof body === "string") update.body = body.trim();
  if (imageUrl !== undefined) update.imageUrl = imageUrl;

  await col.updateOne(
    { _id, isDeleted: false },
    { $set: update }
  );
}

/**
 * Increment/decrement like count (existing like button).
 */
export async function incrementPostLikes(
  id: string | ObjectId,
  delta: number
): Promise<void> {
  const col = await getPostCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  await col.updateOne(
    { _id, isDeleted: false },
    {
      $inc: { likeCount: delta },
      $set: { updatedAt: new Date() },
    }
  );
}

/**
 * Increment/decrement comment count (call from comments API).
 */
export async function incrementPostComments(
  id: string | ObjectId,
  delta: number
): Promise<void> {
  const col = await getPostCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  await col.updateOne(
    { _id, isDeleted: false },
    {
      $inc: { commentCount: delta },
      $set: { updatedAt: new Date() },
    }
  );
}

/**
 * ✅ NEW: Register a single upvote or downvote for a user.
 * Very simple MVP: a user can vote once; if they already voted we ignore.
 */
export async function votePost(params: {
  id: string | ObjectId;
  userId: string;             // logged-in user id (string)
  direction: "up" | "down";   // no toggle/clear yet
}): Promise<void> {
  const { id, userId, direction } = params;
  const col = await getPostCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  const post = await col.findOne({ _id, isDeleted: false });
  if (!post) return;

  const alreadyVoted = post.voters?.includes(userId);
  if (alreadyVoted) {
    // For now ignore multiple votes. Later you can support switch/clear logic.
    return;
  }

  const incField = direction === "up" ? "upvotes" : "downvotes";

  await col.updateOne(
    { _id, isDeleted: false },
    {
      $inc: { [incField]: 1 },
      $addToSet: { voters: userId },
      $set: { updatedAt: new Date() },
    }
  );
}
