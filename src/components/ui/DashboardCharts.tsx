"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, PieChart as PieIcon, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { FundPool } from "@/types/treasury";

interface Alert {
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
}

function AlertBadge({ alert }: { alert: Alert }) {
  const styles = {
    critical: "border-red-500/20 bg-red-500/5 text-red-400",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    info: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  };
  const icons = { critical: AlertCircle, warning: AlertTriangle, info: Info };
  const Icon = icons[alert.level];

  return (
    <div className={`rounded-lg border px-3 py-2 ${styles[alert.level]}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{alert.title}</span>
      </div>
      <p className="text-xs opacity-80">{alert.message}</p>
    </div>
  );
}

export default function DashboardCharts() {
  const [pools, setPools] = useState<FundPool[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch("/api/treasury/pools")
      .then((r) => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setPools(d); })
      .catch(() => {});
    fetch("/api/treasury/alerts")
      .then((r) => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setAlerts(d); })
      .catch(() => {});
  }, []);

  const totalAllocated = pools.reduce((s, p) => s + p.allocated, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Fund Allocation Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
      >
        <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <PieIcon className="h-4 w-4" />
          Fund Pool Allocation
        </h3>
        <div className="space-y-3">
          {pools.map((pool) => {
            const pct = totalAllocated > 0 ? Math.round((pool.allocated / totalAllocated) * 100) : 0;
            const usedPct = pool.maxAllocation ? Math.round((pool.disbursed / pool.maxAllocation) * 100) : 0;
            return (
              <div key={pool.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300 flex items-center gap-1.5">
                    <span>{pool.icon}</span>
                    {pool.name}
                  </span>
                  <span className="text-xs text-gray-500">{pct}% of total</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${pool.color} transition-all duration-1000`}
                    style={{ width: `${Math.min(usedPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                  <span>${pool.disbursed.toLocaleString()} disbursed</span>
                  <span>${pool.allocated.toLocaleString()} allocated</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Treasury Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
      >
        <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Treasury Alerts
        </h3>
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-600">
            No alerts — treasury is healthy
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <AlertBadge key={i} alert={alert} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
