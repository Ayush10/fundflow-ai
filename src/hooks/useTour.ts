"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TOUR_SEGMENTS, type TourSegment } from "@/lib/tour/tourConfig";

const STORAGE_KEY = "fundflow-tour-dismissed";

export type TourState = "idle" | "loading" | "playing" | "paused" | "complete";

export interface UseTourReturn {
  state: TourState;
  currentSegment: TourSegment | null;
  currentSegmentIndex: number;
  progress: number;
  subtitle: string;
  segments: TourSegment[];
  showPrompt: boolean;
  startTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  stopTour: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  dismissPrompt: () => void;
}

export function useTour(): UseTourReturn {
  const [state, setState] = useState<TourState>("idle");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [subtitle, setSubtitle] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollSegmentRef = useRef(-1);
  const userScrolledRef = useRef(false);

  // Check first visit
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track manual user scroll to avoid fighting
  useEffect(() => {
    if (state !== "playing") return;
    const onWheel = () => { userScrolledRef.current = true; };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
    };
  }, [state]);

  const clearHighlights = useCallback(() => {
    TOUR_SEGMENTS.forEach((s) => {
      document.getElementById(s.id)?.classList.remove("tour-highlight-active");
    });
    document.body.classList.remove("tour-active");
  }, []);

  const highlightSegment = useCallback((index: number) => {
    TOUR_SEGMENTS.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      if (i === index) {
        el.classList.add("tour-highlight-active");
        // Only auto-scroll if user hasn't manually scrolled recently
        if (!userScrolledRef.current) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // Reset user scroll flag after a delay
        setTimeout(() => { userScrolledRef.current = false; }, 3000);
      } else {
        el.classList.remove("tour-highlight-active");
      }
    });
  }, []);

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const t = audio.currentTime;
    const dur = audio.duration || 72;
    setProgress((t / dur) * 100);

    // Find current segment for scroll/highlight (uses scrollAt)
    let scrollIdx = -1;
    for (let i = TOUR_SEGMENTS.length - 1; i >= 0; i--) {
      if (t >= TOUR_SEGMENTS[i].scrollAt) { scrollIdx = i; break; }
    }

    if (scrollIdx !== scrollSegmentRef.current && scrollIdx >= 0) {
      scrollSegmentRef.current = scrollIdx;
      highlightSegment(scrollIdx);
    }

    // Find current segment for subtitle (uses audioAt)
    let subIdx = -1;
    for (let i = TOUR_SEGMENTS.length - 1; i >= 0; i--) {
      if (t >= TOUR_SEGMENTS[i].audioAt) { subIdx = i; break; }
    }

    if (subIdx >= 0 && subIdx !== currentSegmentIndex) {
      setCurrentSegmentIndex(subIdx);
      setSubtitle(TOUR_SEGMENTS[subIdx].subtitle);
    }
  }, [currentSegmentIndex, highlightSegment]);

  const startTour = useCallback(async () => {
    setState("loading");
    setShowPrompt(false);
    document.body.classList.add("tour-active");

    try {
      const res = await fetch("/api/tour");
      const data = await res.json();

      const audio = new Audio(data.audioUrl);
      audio.volume = 0.75;
      audioRef.current = audio;

      audio.ontimeupdate = onTimeUpdate;
      audio.onended = () => {
        setState("complete");
        clearHighlights();
        localStorage.setItem(STORAGE_KEY, "true");
      };

      await audio.play();
      setState("playing");
      // Scroll to top for start
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setState("idle");
      clearHighlights();
    }
  }, [onTimeUpdate, clearHighlights]);

  const pauseTour = useCallback(() => {
    audioRef.current?.pause();
    setState("paused");
  }, []);

  const resumeTour = useCallback(() => {
    audioRef.current?.play();
    setState("playing");
  }, []);

  const stopTour = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    setState("complete");
    setSubtitle("");
    setCurrentSegmentIndex(-1);
    scrollSegmentRef.current = -1;
    clearHighlights();
    localStorage.setItem(STORAGE_KEY, "true");
  }, [clearHighlights]);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextIdx = Math.min(currentSegmentIndex + 1, TOUR_SEGMENTS.length - 1);
    audio.currentTime = TOUR_SEGMENTS[nextIdx].scrollAt;
  }, [currentSegmentIndex]);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const prevIdx = Math.max(currentSegmentIndex - 1, 0);
    audio.currentTime = TOUR_SEGMENTS[prevIdx].scrollAt;
  }, [currentSegmentIndex]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearHighlights();
    };
  }, [clearHighlights]);

  return {
    state,
    currentSegment: currentSegmentIndex >= 0 ? TOUR_SEGMENTS[currentSegmentIndex] : null,
    currentSegmentIndex,
    progress,
    subtitle,
    segments: TOUR_SEGMENTS,
    showPrompt,
    startTour,
    pauseTour,
    resumeTour,
    stopTour,
    skipForward,
    skipBackward,
    dismissPrompt,
  };
}
