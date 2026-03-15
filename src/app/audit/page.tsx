"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import type { AuditRecord } from "@/types/api";
import { getAuditRecords } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { PageLoader, EmptyState } from "@/components/ui/LoadingSpinner";
import {
  formatDate,
  shortenAddress,
  solanaExplorerUrl,
  cn,
  getScoreColor,
} from "@/lib/utils";

type DecisionFilter = "all" | "approved" | "rejected" | "flagged";

export default function AuditPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DecisionFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getAuditRecords().then((r) => {
      setRecords(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  const filtered =
    filter === "all"
      ? records
      : records.filter((r) => r.decision === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="mt-1 text-sm text-gray-400">
            {records.length} on-chain decision records (Metaplex Core)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          {(["all", "approved", "rejected", "flagged"] as DecisionFilter[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {f}
              </button>
            )
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No audit records"
          description={
            filter === "all"
              ? "No decisions have been recorded on-chain yet."
              : `No ${filter} decisions found.`
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((record, i) => {
            const isExpanded = expandedId === record.id;
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                {/* Row header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : record.id)
                  }
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <Shield className="h-5 w-5 shrink-0 text-violet-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {record.proposalTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatDate(record.timestamp)} &middot;{" "}
                      {shortenAddress(record.applicantWallet)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-lg font-bold",
                      getScoreColor(record.score)
                    )}
                  >
                    {record.score}
                  </span>
                  <StatusBadge status={record.decision} />
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                  )}
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 p-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          {/* Rationale */}
                          <div>
                            <p className="mb-2 text-xs font-medium text-gray-400">
                              Decision Rationale
                            </p>
                            <p className="text-sm leading-relaxed text-gray-300">
                              {record.rationale}
                            </p>
                          </div>

                          {/* On-chain details */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-gray-400">
                                Core Asset Address
                              </p>
                              <p className="mt-1 break-all font-mono text-xs text-gray-300">
                                {record.coreAssetAddress}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-400">
                                Transaction Hash
                              </p>
                              <a
                                href={solanaExplorerUrl(record.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {shortenAddress(record.txHash, 8)}
                              </a>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-400">
                                Applicant Wallet
                              </p>
                              <p className="mt-1 break-all font-mono text-xs text-gray-300">
                                {record.applicantWallet}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
