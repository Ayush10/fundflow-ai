export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { addComment, listComments } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(listComments(id));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as { author?: string; text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const comment = addComment(id, body.author ?? "Judge", body.text.trim());
  return NextResponse.json(comment, { status: 201 });
}
