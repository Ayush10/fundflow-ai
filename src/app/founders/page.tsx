"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Github,
  Star,
  TrendingUp,
} from "lucide-react";
import type { FounderProfile } from "@/types/agents";
import { shortenAddress } from "@/lib/utils";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/20 text-emerald-400"
      : score >= 50
      ? "bg-amber-500/20 text-amber-400"
      : "bg-red-500/20 text-red-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}/100
    </span>
  );
}

function DecisionIcon({ decision }: { decision: string }) {
  if (decision === "approved")
    return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  if (decision === "rejected")
    return <XCircle className="h-4 w-4 text-red-400" />;
  return <AlertTriangle className="h-4 w-4 text-amber-400" />;
}

export default function FoundersPage() {
  const [founders, setFounders] = useState<FounderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/founders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFounders(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const funded = founders.filter((f) => f.totalFunded > 0);
  const notFunded = founders.filter((f) => f.totalFunded === 0);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Founder Profiles</h1>
          </div>
          <p className="text-sm text-gray-400">
            Multi-agent due diligence results for all applicants. Reputation scores aggregated
            from Twitter, Reddit, Google, Y Combinator, and HackerNews.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Founders", value: founders.length, color: "text-blue-400" },
            { label: "Funded", value: funded.length, color: "text-emerald-400" },
            { label: "Not Funded", value: notFunded.length, color: "text-red-400" },
            {
              label: "Avg Reputation",
              value:
                founders.length > 0
                  ? Math.round(
                      founders.reduce((s, f) => s + f.reputationScore, 0) / founders.length
                    )
                  : 0,
              color: "text-amber-400",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
            >
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : founders.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">
              No founder profiles yet. Submit and evaluate proposals to build the database.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {founders.map((founder, i) => (
              <motion.div
                key={founder.wallet}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/5 bg-white/[0.03] p-5 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {founder.name ?? shortenAddress(founder.wallet, 6)}
                      </h3>
                      <ScoreBadge score={founder.reputationScore} />
                      {founder.totalFunded > 0 && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                          Funded
                        </span>
                      )}
                    </div>

                    {/* Platform badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {founder.platforms.github && (
                        <a
                          href={founder.platforms.github.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:text-white"
                        >
                          <Github className="h-3 w-3" />
                          {founder.platforms.github.username}
                          <Star className="h-3 w-3 text-yellow-500" />
                          {founder.platforms.github.stars}
                        </a>
                      )}
                      {founder.platforms.twitter && (
                        <a
                          href={founder.platforms.twitter.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:text-white"
                        >
                          𝕏 @{founder.platforms.twitter.handle}
                          <span className="text-blue-400">
                            {founder.platforms.twitter.followers.toLocaleString()}
                          </span>
                        </a>
                      )}
                      {founder.platforms.ycombinator?.found && (
                        <span className="flex items-center gap-1 rounded bg-orange-900/30 px-2 py-1 text-xs text-orange-400">
                          <TrendingUp className="h-3 w-3" />
                          YC {founder.platforms.ycombinator.batch}
                        </span>
                      )}
                    </div>

                    {/* Wallet */}
                    <a
                      href={`https://explorer.solana.com/address/${founder.wallet}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                    >
                      {shortenAddress(founder.wallet, 6)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Right: Stats */}
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Requested</p>
                      <p className="font-semibold text-white">
                        ${founder.totalRequested.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Funded</p>
                      <p className="font-semibold text-emerald-400">
                        ${founder.totalFunded.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Proposals</p>
                      <p className="font-semibold text-white">{founder.proposals.length}</p>
                    </div>
                  </div>
                </div>

                {/* Proposals table */}
                {founder.proposals.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-3">
                    <div className="space-y-1.5">
                      {founder.proposals.map((p) => (
                        <Link
                          key={p.id}
                          href={`/proposals/${p.id}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <DecisionIcon decision={p.decision} />
                            <span className="text-gray-300">{p.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>${p.amount.toLocaleString()}</span>
                            <span>Score: {p.score}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
