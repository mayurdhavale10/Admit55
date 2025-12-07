// src/app/api/community/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getPostById,
  softDeletePost,
} from "@src/models/community/post.model";

type RouteParams = { params: { id: string } };

// 🔹 GET /api/community/posts/[id]
//    → fetch a single post (if not deleted)
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const postId = params.id;

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json(
        { success: false, error: "Invalid post id" },
        { status: 400 },
      );
    }

    const post = await getPostById(postId);

    if (!post || post.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        post,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[GET /api/community/posts/[id]] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to load post",
      },
      { status: 500 },
    );
  }
}

// 🔹 DELETE /api/community/posts/[id]
// Body JSON:
// {
//   "authorId": "loggedInUserId"  // ✅ for now; later from session
// }
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const postId = params.id;

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json(
        { success: false, error: "Invalid post id" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const authorId = String(body.authorId || "").trim();

    if (!authorId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "authorId is required for delete right now (later we will use auth session)",
        },
        { status: 400 },
      );
    }

    const post = await getPostById(postId);

    if (!post || post.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    // ✅ Only author can delete (admin override can be added later)
    const postAuthorId = post.authorId.toString();
    if (postAuthorId !== authorId) {
      return NextResponse.json(
        { success: false, error: "Not allowed to delete this post" },
        { status: 403 },
      );
    }

    await softDeletePost(postId);

    return NextResponse.json(
      {
        success: true,
        postId,
        deleted: true,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[DELETE /api/community/posts/[id]] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to delete post",
      },
      { status: 500 },
    );
  }
}
