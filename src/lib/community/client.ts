// src/lib/community/client.ts
"use client";

// ---------- Types shared with UI ----------

export interface CommunityChannel {
  _id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface CommunityPost {
  _id: string;

  title: string;
  body: string;
  imageUrl?: string | null;

  authorId: string;
  channelId: string;
  channelName?: string;

  // voting
  upvotes: number;
  downvotes: number;
  voters?: string[]; // optional on client

  commentCount: number;

  createdAt: string;
  updatedAt: string;

  // optional extra for UI
  authorName?: string;
  authorAvatar?: string | null;
}

export interface CommunityComment {
  _id: string;
  postId: string;
  authorId: string;
  body: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Internal helpers ----------

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;

    if (text) {
      try {
        const data = JSON.parse(text) as any;

        message =
          // common API shapes
          data?.error?.message ??
          data?.message ??
          (Array.isArray(data?.errors) && data.errors[0]?.message) ??
          // 👇 this was previously throwing (data.error.id without ?.)
          data?.error?.id ??
          message;
      } catch {
        // ignore JSON parse errors and keep default message
      }
    }

    throw new Error(message);
  }

  if (!text) {
    // empty body but 2xx → return empty object of expected type
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Failed to parse server response");
  }
}

// Small wrapper for GET with no-store
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });
  return parseJsonOrThrow<T>(res);
}

// ---------- Channels ----------

export async function fetchChannels(): Promise<CommunityChannel[]> {
  const json = await getJson<{ channels?: CommunityChannel[] }>(
    "/api/community/channels",
  );
  return json.channels ?? [];
}

// ---------- Posts (new unified helpers) ----------

type FetchPostsOptions = {
  sort?: "latest" | "trending";
  mine?: boolean;
  channelId?: string;
  limit?: number;
  skip?: number;
  authorId?: string; // for "mine"
};

/**
 * Fetch posts for the MBA community feed.
 * Supports filters: latest / trending / mine.
 */
export async function fetchPosts(
  opts: FetchPostsOptions = {},
): Promise<CommunityPost[]> {
  const {
    sort = "latest",
    mine = false,
    channelId,
    limit,
    skip,
    authorId,
  } = opts;

  const params = new URLSearchParams();

  if (sort) params.set("sort", sort);
  if (mine) params.set("mine", "true");
  if (channelId) params.set("channelId", channelId);
  if (typeof limit === "number") params.set("limit", String(limit));
  if (typeof skip === "number") params.set("skip", String(skip));
  if (authorId && mine) params.set("authorId", authorId);

  const url =
    params.toString().length > 0
      ? `/api/community/posts?${params.toString()}`
      : "/api/community/posts";

  const json = await getJson<{ posts?: CommunityPost[] }>(url);
  return json.posts ?? [];
}

/**
 * Create a new post.
 * For now we pass authorId from client; later you can derive from session on the server.
 */
export async function createPost(payload: {
  title: string;
  body: string;
  channelId: string;
  authorId: string;
  imageUrl?: string | null;
}): Promise<CommunityPost> {
  const res = await fetch("/api/community/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJsonOrThrow<{ post: CommunityPost }>(res);
  return json.post;
}

/**
 * Delete a post by id (server will check author).
 */
export async function deletePost(postId: string): Promise<void> {
  const res = await fetch(`/api/community/posts/${postId}`, {
    method: "DELETE",
  });

  await parseJsonOrThrow<{}>(res);
}

/**
 * Upvote a post (server enforces one-vote-per-user).
 */
export async function upvotePost(
  postId: string,
  userId: string,
): Promise<CommunityPost> {
  const res = await fetch(`/api/community/posts/${postId}/upvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const json = await parseJsonOrThrow<{ post: CommunityPost }>(res);
  return json.post;
}

/**
 * Downvote a post (server enforces one-vote-per-user).
 */
export async function downvotePost(
  postId: string,
  userId: string,
): Promise<CommunityPost> {
  const res = await fetch(`/api/community/posts/${postId}/downvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const json = await parseJsonOrThrow<{ post: CommunityPost }>(res);
  return json.post;
}

// ---------- (Optional) Comments helpers ----------

export async function fetchCommentsByPost(
  postId: string,
): Promise<CommunityComment[]> {
  const params = new URLSearchParams({ postId });
  const json = await getJson<{ comments?: CommunityComment[] }>(
    `/api/community/comments?${params.toString()}`,
  );
  return json.comments ?? [];
}

export async function createComment(payload: {
  postId: string;
  authorId: string;
  body: string;
}): Promise<CommunityComment> {
  const res = await fetch("/api/community/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJsonOrThrow<{ comment: CommunityComment }>(res);
  return json.comment;
}
