"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  FileText,
  Shield,
  ArrowRight,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Proposal, TreasuryState, AuditRecord } from "@/types/api";
import { getProposals, getTreasury, getAuditRecords } from "@/lib/api";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import OnChainStatus from "@/components/ui/OnChainStatus";
import DashboardCharts from "@/components/ui/DashboardCharts";
import ActivityFeed from "@/components/ui/ActivityFeed";
import FundingCharts from "@/components/ui/FundingCharts";
import SponsorShowcase from "@/components/ui/SponsorShowcase";
import { formatUSDC, formatDate, shortenAddress, getScoreColor, solanaExplorerUrl } from "@/lib/utils";

export default function DashboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [treasury, setTreasury] = useState<TreasuryState | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [p, t, a] = await Promise.all([
      getProposals(),
      getTreasury(),
      getAuditRecords(),
    ]);
    setProposals(p);
    setTreasury(t);
    setAuditRecords(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.all([getProposals(), getTreasury(), getAuditRecords()]).then(
      ([p, t, a]) => {
        setProposals(p);
        setTreasury(t);
        setAuditRecords(a);
        setLoading(false);
      }
    );
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading || !treasury) return <PageLoader />;

  const approved = proposals.filter((p) => p.status === "approved").length;
  const pending = proposals.filter(
    (p) => p.status === "pending" || p.status === "evaluating"
  ).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        id="tour-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-8"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm text-violet-400">
            <Zap className="h-4 w-4" />
            Autonomous Grant Allocation on Solana
          </div>
          <h1 className="mt-3 text-4xl font-bold">
            Fund<span className="gradient-text">Flow</span> AI
          </h1>
          <p className="mt-2 max-w-xl text-gray-400">
            AI-powered proposal evaluation with on-chain audit trails. Verify
            humanity, research viability, score proposals, and disburse USDC —
            all autonomously.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/proposals/new"
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Submit Proposal
            </Link>
            <Link
              href="/audit"
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5"
            >
              View Audit Trail
            </Link>
          </div>
        </div>
        {/* Decorative gradient blob */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-600/20 blur-3xl" />
      </motion.div>

      {/* Stats */}
      <motion.div
        id="tour-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Treasury Balance"
          value={formatUSDC(treasury.usdcBalance)}
          icon={DollarSign}
        />
        <StatCard
          label="Meteora Yield"
          value={formatUSDC(treasury.meteoraYieldEarned)}
          icon={TrendingUp}
          trend="+2.4% APY"
          trendUp
        />
        <StatCard
          label="Proposals"
          value={`${approved} approved / ${pending} pending`}
          icon={FileText}
        />
        <StatCard
          label="Audit Records"
          value={`${auditRecords.length} on-chain`}
          icon={Shield}
        />
      </motion.div>

      {/* Funding Charts + Approval Rates */}
      <div id="tour-funding">
        <FundingCharts />
      </div>

      {/* Fund Pools + Treasury Alerts */}
      <div id="tour-pools">
        <DashboardCharts />
      </div>

      {/* Activity Feed */}
      <div id="tour-activity">
        <ActivityFeed />
      </div>

      {/* On-Chain Status */}
      <div id="tour-onchain">
        <OnChainStatus />
      </div>

      {/* Two column: Recent proposals + Audit trail */}
      <div id="tour-proposals" className="grid gap-6 lg:grid-cols-2">
        {/* Recent Proposals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Proposals</CardTitle>
              <Link
                href="/proposals"
                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <div className="space-y-3">
              {proposals.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatUSDC(p.requestedAmount)} &middot;{" "}
                      {shortenAddress(p.applicantWallet)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Audit Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <Link
                href="/audit"
                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <div className="space-y-3">
              {auditRecords.slice(0, 4).map((record) => (
                <a
                  key={record.id}
                  href={solanaExplorerUrl(record.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {record.proposalTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatDate(record.timestamp)} &middot;{" "}
                      {shortenAddress(record.applicantWallet)} &middot;{" "}
                      <span className="text-cyan-500">View on Explorer</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${getScoreColor(
                        record.score
                      )}`}
                    >
                      {record.score}
                    </span>
                    <StatusBadge status={record.decision} />
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sponsor Integrations Showcase */}
      <div id="tour-sponsors">
        <SponsorShowcase />
      </div>
    </div>
  );
}
