import { NextRequest, NextResponse } from "next/server";

import { narrateDecision } from "@/lib/voice/elevenlabs";
import { narrationSchema, zodErrorResponse } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = narrationSchema.safeParse(await req.json());

  if (!payload.success) {
    return zodErrorResponse(payload.error);
  }

  const result = await narrateDecision(payload.data.text);
  return NextResponse.json(result);
}
