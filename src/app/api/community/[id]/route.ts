// src/app/api/community/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getCommentById,
  softDeleteComment,
  updateComment,
} from "@src/models/community/comment.model";
import { incrementPostComments } from "@src/models/community/post.model";

/**
 * DELETE /api/community/comments/[id]
 *
 * Soft-delete a comment.
 * Later you can enforce: only author or admin can do this (via auth).
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Comment id is required" },
        { status: 400 }
      );
    }

    // Find comment first so we know its postId for decrementing commentCount
    const existing = await getCommentById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    await softDeleteComment(id);

    // Decrement commentCount on the post (best-effort)
    try {
      await incrementPostComments(existing.postId, -1);
    } catch (e) {
      console.warn(
        "[DELETE /api/community/comments/[id]] incrementPostComments(-1) failed:",
        e
      );
    }

    return NextResponse.json(
      { success: true, message: "Comment deleted" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[DELETE /api/community/comments/[id]] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to delete comment",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/community/comments/[id]
 *
 * Body:
 * {
 *   body: string;
 * }
 *
 * Later you can check author/admin before allowing edit.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Comment id is required" },
        { status: 400 }
      );
    }

    const json = await req.json();
    const newBody = String(json.body || "").trim();

    if (!newBody) {
      return NextResponse.json(
        { success: false, error: "Updated comment body cannot be empty" },
        { status: 400 }
      );
    }

    // Optional: ensure comment exists
    const existing = await getCommentById(id);
    if (!existing || existing.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    await updateComment({ id, body: newBody });

    return NextResponse.json(
      { success: true, message: "Comment updated" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[PATCH /api/community/comments/[id]] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to update comment",
      },
      { status: 500 }
    );
  }
}
