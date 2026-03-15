"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Brain,
  DollarSign,
  CheckCircle,
  MessageSquare,
  Activity,
} from "lucide-react";
import type { ActivityEntry } from "@/lib/store";

const ICONS: Record<string, React.ElementType> = {
  proposal_created: FileText,
  evaluation_started: Brain,
  evaluation_complete: CheckCircle,
  disbursement: DollarSign,
  milestone_verified: CheckCircle,
  comment_added: MessageSquare,
};

const COLORS: Record<string, string> = {
  proposal_created: "text-blue-400 bg-blue-500/10",
  evaluation_started: "text-violet-400 bg-violet-500/10",
  evaluation_complete: "text-emerald-400 bg-emerald-500/10",
  disbursement: "text-cyan-400 bg-cyan-500/10",
  milestone_verified: "text-green-400 bg-green-500/10",
  comment_added: "text-gray-400 bg-gray-500/10",
};

export default function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const load = () =>
      fetch("/api/activity")
        .then((r) => r.json())
        .then((d: unknown) => { if (Array.isArray(d)) setEntries(d); })
        .catch(() => {});
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, []);

  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
    >
      <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Live Activity Feed
        <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {entries.slice(0, 15).map((entry, i) => {
          const Icon = ICONS[entry.type] ?? Activity;
          const colorClass = COLORS[entry.type] ?? "text-gray-400 bg-gray-500/10";
          const [iconColor, iconBg] = colorClass.split(" ");

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-start gap-2.5 text-sm"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md mt-0.5 ${iconBg}`}>
                <Icon className={`h-3 w-3 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs">
                  <span className="font-medium text-white">{entry.title}</span>
                  {" — "}
                  {entry.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-600">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  {entry.proposalId && (
                    <Link
                      href={`/proposals/${entry.proposalId}`}
                      className="text-[10px] text-violet-500 hover:text-violet-400"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
