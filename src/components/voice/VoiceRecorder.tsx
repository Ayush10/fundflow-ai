"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void;
  onAudioBlob?: (blob: Blob) => void;
  maxDuration?: number; // seconds
}

const waveformHeights = Array.from({ length: 40 }, (_, i) => {
  return `${48 + Math.sin(i * 0.45) * 22}%`;
});

export default function VoiceRecorder({
  onTranscript,
  onAudioBlob,
  maxDuration = 120,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const transcribeAudio = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);

      try {
        const formData = new FormData();
        formData.append("audio", blob, "voice-pitch.webm");

        const response = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Transcription failed");
        }

        const payload = (await response.json()) as { transcript?: string };
        const nextTranscript =
          payload.transcript ??
          "Transcription unavailable. You can still submit the proposal without voice input.";
        setTranscript(nextTranscript);
        onTranscript(nextTranscript);
      } catch {
        const fallbackTranscript =
          "Transcription unavailable. You can still submit the proposal without voice input.";
        setTranscript(fallbackTranscript);
        onTranscript(fallbackTranscript);
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscript]
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAudioBlob?.(blob);
        stream.getTracks().forEach((track) => track.stop());
        void transcribeAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setTranscript(null);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= maxDuration - 1) {
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      console.error("Microphone access denied");
    }
  }, [maxDuration, onAudioBlob, transcribeAudio]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl]);

  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript(null);
    setDuration(0);
    onTranscript("");
  }, [audioUrl, onTranscript]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300">
        Voice Pitch (optional)
      </label>

      {!audioUrl ? (
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors",
            isRecording
              ? "border-red-500/50 bg-red-500/5 text-red-400"
              : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-violet-500/30 hover:text-white"
          )}
        >
          {isRecording ? (
            <>
              <div className="relative">
                <Square className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-red-500" />
              </div>
              <span className="font-medium">
                Recording... {formatTime(duration)} / {formatTime(maxDuration)}
              </span>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              <span>Record voice pitch (up to {maxDuration / 60} min)</span>
            </>
          )}
        </button>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-8 rounded bg-white/5">
                {/* Waveform placeholder */}
                <div className="flex h-full items-center justify-center gap-0.5 px-2">
                  {waveformHeights.map((height, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-violet-500/60"
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Duration: {formatTime(duration)}
              </p>
            </div>
            <button
              type="button"
              onClick={discardRecording}
              className="shrink-0 text-gray-400 transition-colors hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )}

      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-violet-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcribing with ElevenLabs...
        </div>
      )}

      {transcript && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="mb-1 text-xs font-medium text-gray-400">Transcript</p>
          <p className="text-sm leading-relaxed text-gray-300">{transcript}</p>
        </div>
      )}
    </div>
  );
}
