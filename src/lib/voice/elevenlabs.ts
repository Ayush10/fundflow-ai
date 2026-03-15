import { getAppConfig } from "@/lib/config";
import type {
  VoiceNarrationResponse,
  VoiceTranscriptionResponse,
} from "@/types/api";

function createSilentWavDataUrl(durationMs = 800): string {
  const sampleRate = 8_000;
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = sampleCount;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  buffer.fill(128, 44);

  return `data:audio/wav;base64,${buffer.toString("base64")}`;
}

function buildMockTranscript(input: {
  title?: string;
  description?: string;
  transcript?: string;
}): string {
  if (input.transcript?.trim()) {
    return input.transcript.trim();
  }

  if (input.title?.trim()) {
    return `Voice pitch captured for ${input.title.trim()}. ${input.description?.trim() ?? ""}`.trim();
  }

  return "Mock transcript generated because ElevenLabs STT is not configured yet.";
}

export async function transcribeVoicePitch(input: {
  audioFile?: File;
  description?: string;
  title?: string;
  transcript?: string;
}): Promise<VoiceTranscriptionResponse> {
  const config = getAppConfig();

  if (config.liveElevenLabs && input.audioFile) {
    try {
      const formData = new FormData();
      formData.append("file", input.audioFile);
      formData.append("model_id", "scribe_v1");

      const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: {
          "xi-api-key": config.elevenLabsApiKey!,
        },
        body: formData,
      });

      if (response.ok) {
        const payload = (await response.json()) as Record<string, unknown>;
        const transcript =
          typeof payload.text === "string"
            ? payload.text
            : typeof payload.transcript === "string"
              ? payload.transcript
              : null;

        if (transcript) {
          return {
            transcript,
            provider: "elevenlabs",
          };
        }
      }
    } catch {
      // Fall through to deterministic demo mode.
    }
  }

  return {
    transcript: buildMockTranscript(input),
    provider: "mock",
    confidence: 0.58,
  };
}

export async function narrateDecision(
  text: string
): Promise<VoiceNarrationResponse> {
  const config = getAppConfig();

  if (config.liveElevenLabs && config.elevenLabsVoiceId) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": config.elevenLabsApiKey!,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
          }),
        }
      );

      if (response.ok) {
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        return {
          audioUrl: `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`,
          provider: "elevenlabs",
          text,
        };
      }
    } catch {
      // Fall through to deterministic demo mode.
    }
  }

  return {
    audioUrl: createSilentWavDataUrl(),
    provider: "mock",
    text,
  };
}
