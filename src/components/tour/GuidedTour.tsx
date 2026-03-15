"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Volume2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useTour } from "@/hooks/useTour";

export default function GuidedTour() {
  const {
    state,
    currentSegment,
    currentSegmentIndex,
    progress,
    subtitle,
    segments,
    showPrompt,
    startTour,
    pauseTour,
    resumeTour,
    stopTour,
    skipForward,
    skipBackward,
    dismissPrompt,
  } = useTour();

  // First-visit prompt
  if (showPrompt && state === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-6 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4"
      >
        <div className="rounded-2xl border border-violet-500/30 bg-gray-950/95 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">
                Take the Guided Tour?
              </h3>
              <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                An AI narrator will walk you through all 6 sponsor integrations
                with auto-scrolling highlights. Takes about 70 seconds.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={startTour}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                  Start Tour
                </button>
                <button
                  onClick={dismissPrompt}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="shrink-0 rounded-lg p-1 text-gray-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Loading state
  if (state === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
      >
        <div className="rounded-2xl border border-violet-500/20 bg-gray-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            <div>
              <p className="text-sm font-medium text-white">Generating narration...</p>
              <p className="text-xs text-gray-500">ElevenLabs is synthesizing the tour audio</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Active tour (playing or paused)
  if (state !== "playing" && state !== "paused") return null;

  return (
    <>
      {/* Subtitle overlay */}
      <AnimatePresence mode="wait">
        {subtitle && state === "playing" && (
          <motion.div
            key={currentSegmentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-4"
          >
            <div className="rounded-xl bg-gray-950/90 px-5 py-3 text-center shadow-2xl backdrop-blur-xl border border-white/10">
              <p className="text-sm text-gray-200 leading-relaxed">{subtitle}</p>
              {currentSegment && (
                <p className={`mt-1 text-[10px] font-semibold ${currentSegment.sponsorColor}`}>
                  Powered by {currentSegment.sponsorName}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4"
      >
        <div className="rounded-2xl border border-violet-500/20 bg-gray-950/95 p-3 shadow-2xl backdrop-blur-xl">
          {/* Segment dots */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {segments.map((seg, i) => (
              <div
                key={seg.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSegmentIndex
                    ? "w-6 bg-violet-500"
                    : i < currentSegmentIndex
                    ? "w-1.5 bg-violet-500/50"
                    : "w-1.5 bg-white/10"
                }`}
                title={seg.label}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={skipBackward}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Previous section"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={state === "playing" ? pauseTour : resumeTour}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            >
              {state === "playing" ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={skipForward}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Next section"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Progress bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Volume2 className="h-3 w-3 shrink-0 text-violet-400" />
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {currentSegment && (
                <p className="mt-1 text-[10px] text-gray-500 truncate">
                  {currentSegment.label}
                  <span className={`ml-1 ${currentSegment.sponsorColor}`}>
                    {currentSegment.sponsorName}
                  </span>
                </p>
              )}
            </div>

            {/* Stop/dismiss */}
            <button
              onClick={stopTour}
              className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:text-white transition-colors"
              title="End tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
