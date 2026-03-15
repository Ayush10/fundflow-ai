"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "fundflow-intro-dismissed";

export default function IntroVoiceover() {
  const [show, setShow] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Only show on first visit
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/intro-voiceover.mp3");
      audioRef.current.volume = 0.7;
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const pct =
            (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(isNaN(pct) ? 0 : pct);
        }
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(100);
      };
    }
    audioRef.current.play();
    setIsPlaying(true);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) {
      startPlayback();
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, startPlayback]);

  const dismiss = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  // Auto-play after a short delay on first visit
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        startPlayback();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, startPlayback]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
        >
          <div className="rounded-2xl border border-violet-500/20 bg-gray-950/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500"
              >
                {isPlaying ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Welcome to FundFlow AI
                </p>
                <p className="text-xs text-gray-400">
                  Platform introduction
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <button
                onClick={dismiss}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
