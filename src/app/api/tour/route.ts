export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/config";
import { TOUR_SCRIPT, TOUR_SEGMENTS, TOUR_TOTAL_DURATION } from "@/lib/tour/tourConfig";

// Module-level cache — persists across requests in the same process
let cachedAudioUrl: string | null = null;

async function generateTourAudio(): Promise<string | null> {
  if (cachedAudioUrl) return cachedAudioUrl;

  const config = getAppConfig();
  if (!config.liveElevenLabs || !config.elevenLabsApiKey) return null;

  const voiceId = config.elevenLabsVoiceId ?? "Tu2hPdmCr8ZkKfSFXWyj";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": config.elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: TOUR_SCRIPT,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            speed: 0.9,
          },
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (response.ok) {
      const buf = Buffer.from(await response.arrayBuffer());
      cachedAudioUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
      console.log(`[Tour] Generated tour audio (${buf.length} bytes)`);
      return cachedAudioUrl;
    }
  } catch (err) {
    console.error("[Tour] ElevenLabs TTS failed:", (err as Error).message);
  }

  return null;
}

export async function GET() {
  const audioUrl = await generateTourAudio();

  return NextResponse.json({
    audioUrl: audioUrl ?? "/sounds/intro-voiceover.mp3",
    segments: TOUR_SEGMENTS,
    duration: TOUR_TOTAL_DURATION,
    generated: Boolean(audioUrl),
  });
}
