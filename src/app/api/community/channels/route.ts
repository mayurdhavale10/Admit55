// src/app/api/community/channels/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createChannel,
  getAllActiveChannels,
  ensureDefaultChannels,
} from "@src/models/community/channel.model";

/**
 * GET /api/community/channels
 * - Returns all active (non-deleted) channels
 */
export async function GET() {
  try {
    // Optional: ensure some default channels exist
    await ensureDefaultChannels();

    const channels = await getAllActiveChannels();

    return NextResponse.json(
      {
        success: true,
        channels,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/community/channels] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to load channels",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/channels
 * - Create a new channel
 * - Later you can restrict this to admins only
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const slug = String(body.slug || "").trim();
    const name = String(body.name || "").trim();
    const description =
      typeof body.description === "string" ? body.description : "";

    if (!slug || !name) {
      return NextResponse.json(
        {
          success: false,
          error: "Both 'slug' and 'name' are required",
        },
        { status: 400 }
      );
    }

    // TODO: add auth & admin check here later
    // e.g. const session = await auth();
    // if (session?.user.role !== "admin") return 403;

    const channel = await createChannel({
      slug,
      name,
      description,
      createdByUserId: null, // wire current user ID here later
    });

    return NextResponse.json(
      {
        success: true,
        channel,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/community/channels] error:", err);
    const message =
      err?.message?.includes("already exists") && err?.message
        ? err.message
        : "Failed to create channel";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
