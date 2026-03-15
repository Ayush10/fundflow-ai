"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Github,
  Star,
  TrendingUp,
  Users,
  Globe,
  MessageSquare,
  Shield,
} from "lucide-react";
import type { FounderProfile } from "@/types/agents";
import { shortenAddress } from "@/lib/utils";
import ScoreBar from "@/components/ui/ScoreBar";

function DecisionIcon({ decision }: { decision: string }) {
  if (decision === "approved")
    return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  if (decision === "rejected")
    return <XCircle className="h-4 w-4 text-red-400" />;
  return <AlertTriangle className="h-4 w-4 text-amber-400" />;
}

export default function FounderDetailPage() {
  const params = useParams<{ wallet: string }>();
  const [founder, setFounder] = useState<FounderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params.wallet) return;
    fetch(`/api/founders/${params.wallet}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setFounder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.wallet]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !founder) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-center">
        <Users className="h-12 w-12 text-gray-600 mb-4" />
        <p className="text-gray-400 mb-4">Founder not found</p>
        <Link href="/founders" className="text-violet-400 hover:text-violet-300 text-sm">
          Back to Founders
        </Link>
      </div>
    );
  }

  const repColor =
    founder.reputationScore >= 80
      ? "text-emerald-400"
      : founder.reputationScore >= 50
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/founders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Founders
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {founder.name ?? shortenAddress(founder.wallet, 8)}
              </h1>
              <a
                href={`https://explorer.solana.com/address/${founder.wallet}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300"
              >
                {founder.wallet}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Reputation Score</p>
              <p className={`text-4xl font-bold ${repColor}`}>
                {founder.reputationScore}
                <span className="text-lg text-gray-500">/100</span>
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Funding Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
          >
            <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Funding Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Requested</p>
                <p className="text-xl font-bold text-white">
                  ${founder.totalRequested.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Funded</p>
                <p className="text-xl font-bold text-emerald-400">
                  ${founder.totalFunded.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Proposals</p>
                <p className="text-xl font-bold text-white">
                  {founder.proposals.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Approval Rate</p>
                <p className="text-xl font-bold text-white">
                  {founder.proposals.length > 0
                    ? Math.round(
                        (founder.proposals.filter((p) => p.decision === "approved").length /
                          founder.proposals.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </motion.div>

          {/* Platform Presence */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
          >
            <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Platform Presence
            </h2>
            <div className="space-y-3">
              {founder.platforms.github && (
                <a
                  href={founder.platforms.github.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-gray-300" />
                    <span className="text-sm text-white">
                      @{founder.platforms.github.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{founder.platforms.github.repos} repos</span>
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{founder.platforms.github.stars}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </a>
              )}

              {founder.platforms.twitter && (
                <a
                  href={founder.platforms.twitter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">𝕏</span>
                    <span className="text-sm text-white">
                      @{founder.platforms.twitter.handle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Users className="h-3 w-3" />
                    <span>{founder.platforms.twitter.followers.toLocaleString()}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </a>
              )}

              {founder.platforms.reddit && (
                <a
                  href={founder.platforms.reddit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-white">Reddit</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{founder.platforms.reddit.karma} karma</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </a>
              )}

              {founder.platforms.hackernews && (
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-orange-500 font-bold">Y</span>
                    <span className="text-sm text-white">HackerNews</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {founder.platforms.hackernews.karma} karma
                  </span>
                </div>
              )}

              {founder.platforms.ycombinator?.found && (
                <div className="flex items-center justify-between rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-semibold text-orange-400">
                      Y Combinator
                    </span>
                  </div>
                  <span className="text-xs text-orange-300">
                    {founder.platforms.ycombinator.company}{" "}
                    {founder.platforms.ycombinator.batch &&
                      `(${founder.platforms.ycombinator.batch})`}
                  </span>
                </div>
              )}

              {founder.platforms.google && (
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-white">Google</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {founder.platforms.google.articlesFound} articles /{" "}
                    {founder.platforms.google.sentiment}
                  </span>
                </div>
              )}

              {!founder.platforms.github &&
                !founder.platforms.twitter &&
                !founder.platforms.reddit && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No verified platform presence
                  </p>
                )}
            </div>
          </motion.div>
        </div>

        {/* Proposal History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-xl border border-white/5 bg-white/[0.03] p-5"
        >
          <h2 className="text-sm font-semibold text-gray-400 mb-4">
            Proposal History
          </h2>
          {founder.proposals.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No proposals yet
            </p>
          ) : (
            <div className="space-y-2">
              {founder.proposals.map((p) => (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <DecisionIcon decision={p.decision} />
                    <div>
                      <p className="text-sm font-medium text-white">{p.title}</p>
                      <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        ${p.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Score: {p.score}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.decision === "approved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : p.decision === "rejected"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {p.decision}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex items-center justify-between text-xs text-gray-500"
        >
          <span>First seen: {new Date(founder.firstSeen).toLocaleDateString()}</span>
          <span>Last active: {new Date(founder.lastSeen).toLocaleDateString()}</span>
        </motion.div>
      </div>
    </div>
  );
}
