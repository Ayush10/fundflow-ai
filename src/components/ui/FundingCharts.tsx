"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, PieChart as PieIcon } from "lucide-react";
import type { TreasuryTransaction } from "@/types/treasury";

// Simple bar chart without recharts (SSR-safe)
function SimpleBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{d.label}</span>
            <span className="text-xs text-gray-300 font-medium">
              ${d.value.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full rounded-full ${d.color}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ApprovalPie({ approved, rejected, flagged }: { approved: number; rejected: number; flagged: number }) {
  const total = approved + rejected + flagged || 1;
  const segments = [
    { label: "Approved", count: approved, pct: Math.round((approved / total) * 100), color: "bg-emerald-500", textColor: "text-emerald-400" },
    { label: "Flagged", count: flagged, pct: Math.round((flagged / total) * 100), color: "bg-amber-500", textColor: "text-amber-400" },
    { label: "Rejected", count: rejected, pct: Math.round((rejected / total) * 100), color: "bg-red-500", textColor: "text-red-400" },
  ];

  return (
    <div>
      {/* Stacked bar as visual */}
      <div className="h-4 rounded-full overflow-hidden flex mb-3">
        {segments.map((s) =>
          s.pct > 0 ? (
            <motion.div
              key={s.label}
              initial={{ width: 0 }}
              animate={{ width: `${s.pct}%` }}
              transition={{ duration: 1 }}
              className={`${s.color} h-full`}
            />
          ) : null
        )}
      </div>
      <div className="flex justify-around text-center">
        {segments.map((s) => (
          <div key={s.label}>
            <p className={`text-lg font-bold ${s.textColor}`}>{s.count}</p>
            <p className="text-[10px] text-gray-500">{s.label} ({s.pct}%)</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FundingCharts() {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [proposals, setProposals] = useState<{ status: string }[]>([]);

  useEffect(() => {
    fetch("/api/treasury/transactions")
      .then((r) => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setTransactions(d); })
      .catch(() => {});
    fetch("/api/proposals")
      .then((r) => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setProposals(d); })
      .catch(() => {});
  }, []);

  // Aggregate disbursements by day
  const disbursements = transactions.filter((t) => t.type === "disbursement");
  const dailyData: Record<string, number> = {};
  for (const tx of disbursements) {
    const day = new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyData[day] = (dailyData[day] ?? 0) + tx.amount;
  }
  const chartData = Object.entries(dailyData)
    .slice(-7)
    .map(([label, value]) => ({ label, value, color: "bg-cyan-500" }));

  const approved = proposals.filter((p) => p.status === "approved").length;
  const rejected = proposals.filter((p) => p.status === "rejected").length;
  const flagged = proposals.filter((p) => p.status === "flagged").length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Funding Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
      >
        <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Disbursements Over Time
        </h3>
        {chartData.length > 0 ? (
          <SimpleBarChart data={chartData} />
        ) : (
          <p className="text-xs text-gray-600 text-center py-8">No disbursement data yet</p>
        )}
      </motion.div>

      {/* Approval Rate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
      >
        <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <PieIcon className="h-4 w-4" />
          Proposal Outcomes
        </h3>
        {approved + rejected + flagged > 0 ? (
          <ApprovalPie approved={approved} rejected={rejected} flagged={flagged} />
        ) : (
          <p className="text-xs text-gray-600 text-center py-8">No evaluated proposals yet</p>
        )}
      </motion.div>
    </div>
  );
}
