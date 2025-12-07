// src/app/api/community/posts/[id]/downvote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@src/lib/db/loggedinuser/connectDB";
import { getPostById } from "@src/models/community/post.model";

type RouteParams = { params: { id: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const postId = params.id;
    const body = await req.json().catch(() => ({}));
    const voterId = String(body.voterId || "").trim(); // 👈 later: from auth

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json(
        { success: false, error: "Invalid post id" },
        { status: 400 },
      );
    }

    if (!voterId) {
      return NextResponse.json(
        { success: false, error: "voterId is required (will come from session later)" },
        { status: 400 },
      );
    }

    const existing = await getPostById(postId);
    if (!existing || existing.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    const voterKey = String(voterId);
    const currentVoters = Array.isArray((existing as any).voters)
      ? ((existing as any).voters as string[])
      : [];

    // Already voted → no-op
    if (currentVoters.includes(voterKey)) {
      return NextResponse.json(
        {
          success: true,
          alreadyVoted: true,
          postId: String(existing._id),
          upvotes: (existing as any).upvotes ?? 0,
          downvotes: (existing as any).downvotes ?? 0,
        },
        { status: 200 },
      );
    }

    const db = await connectDB();
    const col = db.collection("community_posts");

    const nowUp = (existing as any).upvotes ?? 0;
    const nowDown = (existing as any).downvotes ?? 0;

    await col.updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          upvotes: nowUp,
          downvotes: nowDown + 1,
          updatedAt: new Date(),
        },
        $addToSet: { voters: voterKey },
      },
    );

    return NextResponse.json(
      {
        success: true,
        postId,
        upvotes: nowUp,
        downvotes: nowDown + 1,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[POST /api/community/posts/[id]/downvote] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to downvote post",
      },
      { status: 500 },
    );
  }
}
