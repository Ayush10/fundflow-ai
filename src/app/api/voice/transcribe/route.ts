import { NextRequest, NextResponse } from "next/server";

import { transcribeVoicePitch } from "@/lib/voice/elevenlabs";
import { badRequest, validateAudioFile } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const title = formData.get("title");
    const description = formData.get("description");
    const transcript = formData.get("transcript");

    const audioError = validateAudioFile(audio);
    if (audioError) {
      return badRequest(audioError);
    }

    const result = await transcribeVoicePitch({
      audioFile: audio as File,
      title: typeof title === "string" ? title : undefined,
      description: typeof description === "string" ? description : undefined,
      transcript: typeof transcript === "string" ? transcript : undefined,
    });

    return NextResponse.json(result);
  }

  const payload = (await req.json()) as Record<string, unknown>;
  if (
    typeof payload.transcript !== "string" &&
    typeof payload.title !== "string" &&
    typeof payload.description !== "string"
  ) {
    return badRequest(
      "Provide an audio file or some proposal text so a transcript can be generated."
    );
  }
  const result = await transcribeVoicePitch({
    title: typeof payload.title === "string" ? payload.title : undefined,
    description:
      typeof payload.description === "string" ? payload.description : undefined,
    transcript:
      typeof payload.transcript === "string" ? payload.transcript : undefined,
  });

  return NextResponse.json(result);
}
