"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Plus, RefreshCw } from "lucide-react";
import type { Proposal, ProposalStatus } from "@/types/api";
import { getProposals } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { PageLoader, EmptyState } from "@/components/ui/LoadingSpinner";
import { formatUSDC, formatDate, shortenAddress } from "@/lib/utils";

const statusFilters: (ProposalStatus | "all")[] = [
  "all",
  "pending",
  "evaluating",
  "approved",
  "rejected",
  "flagged",
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProposalStatus | "all">("all");

  const refresh = useCallback(() => {
    getProposals().then(setProposals);
  }, []);

  useEffect(() => {
    getProposals().then((p) => {
      setProposals(p);
      setLoading(false);
    });
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) return <PageLoader />;

  const filtered =
    filter === "all" ? proposals : proposals.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="mt-1 text-sm text-gray-400">
            {proposals.length} total proposals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/proposals/new"
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === s
                ? "bg-violet-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Proposal list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No proposals found"
          description={
            filter === "all"
              ? "No proposals have been submitted yet."
              : `No proposals with status "${filter}".`
          }
          action={
            <Link
              href="/proposals/new"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Submit a Proposal
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((proposal, i) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/proposals/${proposal.id}`}
                className="block rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-violet-400" />
                      <h3 className="truncate text-base font-semibold text-white">
                        {proposal.title}
                      </h3>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                      {proposal.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>
                        Requested:{" "}
                        <span className="font-medium text-gray-300">
                          {formatUSDC(proposal.requestedAmount)}
                        </span>
                      </span>
                      <span>
                        Wallet: {shortenAddress(proposal.applicantWallet)}
                      </span>
                      <span>{formatDate(proposal.createdAt)}</span>
                      {proposal.decision && (
                        <span>
                          Score:{" "}
                          <span className="font-medium text-gray-300">
                            {proposal.decision.scores.overall}/100
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={proposal.status} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
