"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  agentId: string;
  agentName: string;
  emoji: string;
  text: string;
  type: string;
  audioUrl?: string;
}

const AGENT_COLORS: Record<string, string> = {
  scout: "border-blue-500/30 bg-blue-500/5",
  digger: "border-orange-500/30 bg-orange-500/5",
  verifier: "border-green-500/30 bg-green-500/5",
  analyst: "border-purple-500/30 bg-purple-500/5",
  judge: "border-amber-500/30 bg-amber-500/5",
};

const NAME_COLORS: Record<string, string> = {
  scout: "text-blue-400",
  digger: "text-orange-400",
  verifier: "text-green-400",
  analyst: "text-purple-400",
  judge: "text-amber-400",
};

const TYPE_LABELS: Record<string, { text: string; color: string }> = {
  discovery: { text: "Discovery", color: "text-cyan-400" },
  verification: { text: "Verified", color: "text-green-400" },
  challenge: { text: "Challenge", color: "text-red-400" },
  agreement: { text: "Agrees", color: "text-emerald-400" },
  verdict: { text: "Verdict", color: "text-amber-400" },
};

export default function AgentConversation({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="border-b border-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Agent Council — Live Discussion
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {messages.length} messages from 5 specialized due diligence agents
        </p>
      </div>

      <div className="max-h-[500px] overflow-y-auto p-3 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const typeInfo = TYPE_LABELS[msg.type] ?? TYPE_LABELS.discovery;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={`rounded-lg border px-3 py-2.5 ${
                  AGENT_COLORS[msg.agentId] ?? "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{msg.emoji}</span>
                  <span
                    className={`text-xs font-bold ${
                      NAME_COLORS[msg.agentId] ?? "text-gray-300"
                    }`}
                  >
                    {msg.agentName}
                  </span>
                  <span className={`text-[10px] font-medium ${typeInfo.color}`}>
                    {typeInfo.text}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{msg.text}</p>
                {msg.audioUrl && (
                  <audio
                    src={msg.audioUrl}
                    autoPlay
                    controls
                    className="mt-2 h-8 w-full opacity-70"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
