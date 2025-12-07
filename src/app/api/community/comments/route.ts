// src/app/api/community/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createComment,
  getCommentsByPost,
} from "@src/models/community/comment.model";
import { incrementPostComments } from "@src/models/community/post.model";

/**
 * GET /api/community/comments
 *
 * Query params:
 * - postId (required): which post's comments to fetch
 * - limit (optional): default 50
 * - skip  (optional): pagination, default 0
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const limit = Number(searchParams.get("limit") || "50");
    const skip = Number(searchParams.get("skip") || "0");

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: "postId query param is required",
        },
        { status: 400 }
      );
    }

    const comments = await getCommentsByPost({
      postId,
      limit: Number.isNaN(limit) ? 50 : limit,
      skip: Number.isNaN(skip) ? 0 : skip,
    });

    return NextResponse.json(
      {
        success: true,
        comments,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/community/comments] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to load comments",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/comments
 *
 * Body JSON:
 * {
 *   postId: string;
 *   authorId: string;   // later: derive from logged-in user
 *   body: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const postId = String(body.postId || "").trim();
    const authorId = String(body.authorId || "").trim();
    const content = String(body.body || "").trim();

    if (!postId || !authorId || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "postId, authorId and body are required",
        },
        { status: 400 }
      );
    }

    const comment = await createComment({
      postId,
      authorId,
      body: content,
    });

    // keep post.commentCount in sync
    try {
      await incrementPostComments(postId, +1);
    } catch (e) {
      console.warn(
        "[POST /api/community/comments] incrementPostComments failed:",
        e
      );
    }

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/community/comments] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to create comment",
      },
      { status: 500 }
    );
  }
}
