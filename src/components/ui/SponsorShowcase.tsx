"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Mic,
  Shield,
  Coins,
  Brain,
  Search,
  ExternalLink,
  CheckCircle,
  Zap,
} from "lucide-react";

interface SponsorCard {
  name: string;
  role: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  url: string;
  status: "live" | "active";
}

const SPONSORS: SponsorCard[] = [
  {
    name: "Unbrowse",
    role: "Browser Agent",
    description:
      "Autonomous web research agent that reverse-engineers GitHub, Twitter, Reddit, HackerNews, Google, and Y Combinator to build verified applicant profiles — structured data extraction for on-chain due diligence.",
    features: [
      "6-platform parallel scraping (X, GitHub, Reddit, HN, Google, YC)",
      "Structured JSON data extraction with targeted intents",
      "Real-time browser automation on port 6969",
      "Feeds directly into reputation scoring pipeline",
      "Fallback to deterministic profiles when offline",
    ],
    icon: Search,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/5",
    url: "https://unbrowse.ai",
    status: "live",
  },
  {
    name: "ElevenLabs",
    role: "Voice AI",
    description:
      "Multi-voice narration system where 5 AI agents speak their findings aloud during due diligence. Each agent has a distinct voice — Scout, Digger, Verifier report discoveries, Judge delivers the verdict.",
    features: [
      "5 distinct agent voices (Rachel, Antoni, Arnold, Adam, custom)",
      "Per-agent narration on key discovery moments",
      "Voice pitch transcription (STT) for proposal submissions",
      "Judge verdict narration with decision rationale",
      "Silent WAV fallback for graceful degradation",
    ],
    icon: Mic,
    color: "text-violet-400",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/5",
    url: "https://elevenlabs.io",
    status: "live",
  },
  {
    name: "Solana + Metaplex",
    role: "On-Chain Infrastructure",
    description:
      "Every grant decision is minted as an immutable Metaplex Core NFT on Solana devnet. USDC disbursements are real SPL token transfers. Agent identity is registered on-chain via the Metaplex Agent Registry.",
    features: [
      "Metaplex Core NFT audit trail (immutable decision records)",
      "Real USDC (SPL Token) disbursements to applicant wallets",
      "Metaplex Agent Registry — on-chain agent identity",
      "Verifiable on Solana Explorer (devnet)",
      "Transaction hashes linked from every decision",
    ],
    icon: Shield,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    url: "https://solana.com",
    status: "live",
  },
  {
    name: "Meteora",
    role: "DeFi Yield",
    description:
      "Idle treasury funds are automatically deposited into Meteora dynamic vaults to earn yield. The system maintains a 62/38 liquid-to-vault ratio with a $9,000 minimum liquid buffer, auto-rebalancing after every disbursement.",
    features: [
      "Dynamic vault yield optimization (~4.5% APY)",
      "Auto-rebalance: 62% liquid / 38% vault target",
      "$9,000 minimum liquid buffer maintained",
      "Yield accrual tracked in transaction ledger",
      "Withdraw-on-demand for approved disbursements",
    ],
    icon: Coins,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    url: "https://meteora.ag",
    status: "live",
  },
  {
    name: "human.tech (Passport)",
    role: "Sybil Resistance",
    description:
      "Every applicant is verified through the Gitcoin Passport protocol via human.tech API. Humanity scores below the configurable threshold (currently 20) trigger automatic rejection before any capital is at risk.",
    features: [
      "Passport.xyz API integration with scorer ID",
      "Configurable humanity score threshold",
      "Pre-screening: rejects before due diligence if Sybil",
      "Wallet-based verification (no PII required)",
      "Deterministic fallback from wallet hash",
    ],
    icon: Globe,
    color: "text-green-400",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/5",
    url: "https://passport.xyz",
    status: "live",
  },
  {
    name: "OpenAI GPT-4o",
    role: "AI Evaluation",
    description:
      "GPT-4o evaluates every proposal across 5 weighted criteria and generates a natural multi-agent debate script. The AI factors in reputation scores, platform research data, and partner database matches for context-aware decisions.",
    features: [
      "5-criteria scoring: impact, feasibility, credibility, budget, mission",
      "Natural multi-agent debate script generation",
      "Reputation-aware evaluation (feeds in platform data)",
      "Risk assessment: budget, team, timeline, market dimensions",
      "Heuristic fallback for zero-API-key demo mode",
    ],
    icon: Brain,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    url: "https://openai.com",
    status: "live",
  },
];

export default function SponsorShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-violet-400" />
          <h2 className="text-lg font-bold text-white">
            Powered by 6 Live Integrations
          </h2>
          <Zap className="h-4 w-4 text-violet-400" />
        </div>
        <p className="text-sm text-gray-500">
          Each sponsor technology is deeply integrated — not just imported, but core to the autonomous pipeline
        </p>
      </div>

      {/* Sponsor Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPONSORS.map((sponsor, i) => (
          <motion.div
            key={sponsor.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`relative rounded-xl border ${sponsor.borderColor} ${sponsor.bgColor} p-5 overflow-hidden group hover:border-opacity-60 transition-colors`}
          >
            {/* Live badge */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sponsor.bgColor} border ${sponsor.borderColor}`}>
                <sponsor.icon className={`h-5 w-5 ${sponsor.color}`} />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${sponsor.color}`}>
                  {sponsor.name}
                </h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {sponsor.role}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              {sponsor.description}
            </p>

            {/* Features */}
            <ul className="space-y-1.5 mb-3">
              {sponsor.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                  <CheckCircle className={`h-3 w-3 mt-0.5 shrink-0 ${sponsor.color}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Link */}
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[11px] ${sponsor.color} hover:underline`}
            >
              {sponsor.url.replace("https://", "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
