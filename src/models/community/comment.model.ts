// src/models/community/comment.model.ts
import { Collection, ObjectId } from "mongodb";
import { connectDB } from "@src/lib/db/loggedinuser/connectDB"; // ✅ use connectDB

export interface CommunityComment {
  _id?: ObjectId;

  postId: ObjectId;
  authorId: ObjectId;

  body: string;

  // 👍 legacy like-style counter (can be used as net score or kept for UI)
  likeCount: number;

  // 🔼 / 🔽 voting fields (production-ready)
  upvotes: number;
  downvotes: number;
  voters: string[]; // store userId strings to prevent double voting

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------
// Internal helper
// --------------------

async function getCommentCollection(): Promise<Collection<CommunityComment>> {
  const db = await connectDB(); // ✅ returns Db
  return db.collection<CommunityComment>("community_comments");
}

// --------------------
// CRUD helpers
// --------------------

/**
 * Create a new comment for a post.
 */
export async function createComment(input: {
  postId: string | ObjectId;
  authorId: string | ObjectId;
  body: string;
}): Promise<CommunityComment> {
  const col = await getCommentCollection();
  const now = new Date();

  const doc: CommunityComment = {
    postId:
      typeof input.postId === "string"
        ? new ObjectId(input.postId)
        : input.postId,
    authorId:
      typeof input.authorId === "string"
        ? new ObjectId(input.authorId)
        : input.authorId,
    body: input.body.trim(),
    likeCount: 0,          // keep for compatibility
    upvotes: 0,            // new
    downvotes: 0,          // new
    voters: [],            // new
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Get a single comment by ID.
 */
export async function getCommentById(
  id: string | ObjectId
): Promise<CommunityComment | null> {
  const col = await getCommentCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  return col.findOne({ _id, isDeleted: false });
}

/**
 * Get comments for a given post (newest first).
 */
export async function getCommentsByPost(params: {
  postId: string | ObjectId;
  limit?: number;
  skip?: number;
}): Promise<CommunityComment[]> {
  const { postId, limit = 50, skip = 0 } = params;

  const col = await getCommentCollection();
  const pId = typeof postId === "string" ? new ObjectId(postId) : postId;

  return col
    .find({ postId: pId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

/**
 * Soft delete a comment (admin or author in API layer).
 */
export async function softDeleteComment(
  id: string | ObjectId
): Promise<void> {
  const col = await getCommentCollection();
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
 * Update comment body (only allowed for author or admin in API layer).
 */
export async function updateComment(params: {
  id: string | ObjectId;
  body: string;
}): Promise<void> {
  const { id, body } = params;
  const col = await getCommentCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  await col.updateOne(
    { _id, isDeleted: false },
    {
      $set: {
        body: body.trim(),
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Legacy: increment / decrement like count on a comment.
 * (You can still use this for simple “likes” if you want.)
 */
export async function incrementCommentLikes(
  id: string | ObjectId,
  delta: number
): Promise<void> {
  const col = await getCommentCollection();
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
 * New: generic vote counter helper.
 * API route should handle user-level logic (checking voters[]).
 */
export async function incrementCommentVotes(params: {
  id: string | ObjectId;
  upvoteDelta?: number;
  downvoteDelta?: number;
}): Promise<void> {
  const { id, upvoteDelta = 0, downvoteDelta = 0 } = params;
  const col = await getCommentCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  const inc: Record<string, number> = {};
  if (upvoteDelta !== 0) inc.upvotes = upvoteDelta;
  if (downvoteDelta !== 0) inc.downvotes = downvoteDelta;

  if (Object.keys(inc).length === 0) return;

  await col.updateOne(
    { _id, isDeleted: false },
    {
      $inc: inc,
      $set: { updatedAt: new Date() },
    }
  );
}
