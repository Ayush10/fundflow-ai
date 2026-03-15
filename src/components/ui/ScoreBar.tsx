"use client";

import { motion } from "framer-motion";
import { getScoreBarColor, getScoreColor } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  score: number;
  animate?: boolean;
  delay?: number;
}

export default function ScoreBar({
  label,
  score,
  animate = true,
  delay = 0,
}: ScoreBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={getScoreColor(score)}>{score}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={`h-full rounded-full ${getScoreBarColor(score)}`}
          initial={animate ? { width: 0 } : { width: `${score}%` }}
          animate={{ width: `${score}%` }}
          transition={{
            duration: 1,
            delay,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
  );
}
