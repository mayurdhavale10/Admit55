/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { writeInbox } from "@src/modules/data-client/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Expect JSON: { text?: string, email?: string, consentTrain?: boolean }
    // or multipart with "file"
    const contentType = req.headers.get("content-type") || "";
    let text = "";
    let email = "";
    let consentTrain = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      email = String(form.get("email") || "").trim().toLowerCase();
      consentTrain = String(form.get("consentTrain") || "") === "true";

      if (!file) {
        return NextResponse.json({ error: "file_required" }, { status: 400 });
      }

      text = await file.text();
    } else {
      const body = await req.json();
      text = String(body.text || "");
      email = String(body.email || "").trim().toLowerCase();
      consentTrain = !!body.consentTrain;
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "empty_text" }, { status: 400 });
    }

    const meta = { email, consentTrain, source: "partner_uploads" };
    
    // Stringify the metadata object to match the string parameter type
    const id = await writeInbox("partner_uploads", text, JSON.stringify(meta));

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "intake_failed", message: e?.message },
      { status: 500 }
    );
  }
}