"use client";

import { useCallback, useRef } from "react";

const SOUNDS = {
  success: "/sounds/success.wav",
  approved: "/sounds/approved.wav",
  error: "/sounds/error.wav",
  failure: "/sounds/failure.wav",
  notification: "/sounds/notification.wav",
  "step-complete": "/sounds/step-complete.wav",
} as const;

export type SoundName = keyof typeof SOUNDS;

export function useSounds() {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const play = useCallback((name: SoundName) => {
    try {
      let audio = audioCache.current.get(name);
      if (!audio) {
        audio = new Audio(SOUNDS[name]);
        audio.volume = 0.4;
        audioCache.current.set(name, audio);
      }
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Browser may block autoplay before user interaction
      });
    } catch {
      // Audio not supported
    }
  }, []);

  return { play };
}
