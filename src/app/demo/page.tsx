"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Search,
  UserCheck,
  Brain,
  Gavel,
  Link as LinkIcon,
  Volume2,
  Users,
  Landmark,
  Zap,
  DollarSign,
  Shield,
  TrendingUp,
  FileText,
} from "lucide-react";
import ScoreBar from "@/components/ui/ScoreBar";
import AgentConversation from "@/components/proposals/AgentConversation";
import { formatUSDC, shortenAddress, solanaExplorerUrl, cn } from "@/lib/utils";
import type { AgentEvent, Proposal, TreasuryState, AuditRecord } from "@/types/api";
import type { FounderProfile } from "@/types/agents";

type DemoPhase =
  | "idle"
  | "tour-loading"
  | "tour-playing"
  | "dashboard"
  | "typing-proposal"
  | "submitting"
  | "evaluating"
  | "results"
  | "founders"
  | "treasury"
  | "complete";

interface AgentMsg {
  agentId: string;
  agentName: string;
  emoji: string;
  text: string;
  type: string;
  audioUrl?: string;
}

const DEMO_PROPOSAL = {
  title: "Solana Pay Mobile SDK",
  description:
    "Building an open-source mobile SDK for Solana Pay integration in iOS and Android apps. Our team has 4 years of Solana development experience. Previously received a Solana Foundation grant for our payment indexer. Active at github.com/solana-labs and x.com/solaboratories. Y Combinator S24 batch. Milestone-based delivery: Phase 1 iOS SDK, Phase 2 Android SDK, Phase 3 merchant dashboard.",
  requestedAmount: 10000,
  applicantWallet: "Dn1SDTkoA5tmSLAsf5inTsGhY7twbcEcSdKZTDmbGxjZ",
};

function TypeWriter({ text, speed = 30, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        setTimeout(() => onDone?.(), 500);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed, onDone]);
  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

export default function DemoPage() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [tourAudioUrl, setTourAudioUrl] = useState<string | null>(null);
  const [tourProgress, setTourProgress] = useState(0);
  const [tourSubtitle, setTourSubtitle] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dashboard data
  const [treasury, setTreasury] = useState<TreasuryState | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);

  // Evaluation state
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [typingField, setTypingField] = useState<"title" | "desc" | "amount" | "wallet" | "done">("title");
  const [agentMessages, setAgentMessages] = useState<AgentMsg[]>([]);
  const [evalScores, setEvalScores] = useState<Record<string, number> | null>(null);
  const [evalDecision, setEvalDecision] = useState<string | null>(null);
  const [evalRationale, setEvalRationale] = useState<string | null>(null);
  const [reputationData, setReputationData] = useState<Record<string, unknown> | null>(null);
  const [onChainTx, setOnChainTx] = useState<string | null>(null);
  const [humanScore, setHumanScore] = useState<number | null>(null);

  // Founders + Treasury results
  const [founders, setFounders] = useState<FounderProfile[]>([]);
  const [transactions, setTransactions] = useState<{ type: string; amount: number; description: string }[]>([]);

  const tourSegments = useRef<{ subtitle: string; audioAt: number; sponsorName: string }[]>([]);

  // Load dashboard data
  useEffect(() => {
    fetch("/api/treasury").then(r => r.json()).then(setTreasury).catch(() => {});
    fetch("/api/proposals").then(r => r.json()).then((d: unknown) => { if (Array.isArray(d)) setProposals(d); }).catch(() => {});
    fetch("/api/audit").then(r => r.json()).then((d: unknown) => { if (Array.isArray(d)) setAuditRecords(d); }).catch(() => {});
  }, []);

  // ─── Start Demo ─────────────────────────────────────────────

  const startDemo = useCallback(async () => {
    setPhase("tour-loading");

    // Fetch tour audio
    try {
      const res = await fetch("/api/tour");
      const data = await res.json();
      setTourAudioUrl(data.audioUrl);
      tourSegments.current = data.segments;

      // Play tour
      setPhase("tour-playing");
      const audio = new Audio(data.audioUrl);
      audio.volume = 0.75;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        const t = audio.currentTime;
        const dur = audio.duration || 72;
        setTourProgress((t / dur) * 100);
        // Find current subtitle
        for (let i = tourSegments.current.length - 1; i >= 0; i--) {
          if (t >= tourSegments.current[i].audioAt) {
            setTourSubtitle(tourSegments.current[i].subtitle);
            break;
          }
        }
      };

      audio.onended = () => {
        setPhase("dashboard");
        setTimeout(() => setPhase("typing-proposal"), 3000);
      };

      await audio.play();
    } catch {
      // Skip tour if fails
      setPhase("dashboard");
      setTimeout(() => setPhase("typing-proposal"), 3000);
    }
  }, []);

  // ─── Auto-submit proposal after typing ─────────────────────

  const handleTypingDone = useCallback(async () => {
    setPhase("submitting");

    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEMO_PROPOSAL),
    });
    const proposal = await res.json();
    setProposalId(proposal.id);

    // Trigger evaluation
    await fetch(`/api/proposals/${proposal.id}/evaluate`, { method: "POST" });
    setPhase("evaluating");

    // Subscribe to SSE stream
    const evtSource = new EventSource(`/api/proposals/${proposal.id}/stream`);
    evtSource.onmessage = (e) => {
      try {
        const event: AgentEvent = JSON.parse(e.data);

        if (event.step === "human-check" && (event.status === "passed" || event.status === "failed")) {
          const d = event.data as { humanityScore?: number } | undefined;
          setHumanScore(d?.humanityScore ?? null);
        }

        if (event.step === "agent-message" && event.data) {
          setAgentMessages(prev => [...prev, event.data as AgentMsg]);
        }

        if (event.step === "reputation-score" && event.data) {
          setReputationData(event.data as Record<string, unknown>);
        }

        if (event.step === "ai-evaluation" && event.status === "complete" && event.data) {
          setEvalScores(event.data as unknown as Record<string, number>);
        }

        if (event.step === "decision" && event.status === "complete" && event.data) {
          const d = event.data as { decision?: string; rationale?: string; narrationAudioUrl?: string };
          setEvalDecision(d.decision ?? null);
          setEvalRationale(d.rationale ?? null);
          if (d.narrationAudioUrl) {
            const narAudio = new Audio(d.narrationAudioUrl);
            narAudio.volume = 0.7;
            narAudio.play().catch(() => {});
          }
        }

        if (event.step === "on-chain" && event.status === "complete") {
          const d = event as { txHash?: string };
          setOnChainTx(d.txHash ?? null);

          // Move to results phase after a short delay
          setTimeout(() => {
            evtSource.close();
            setPhase("results");

            // Load founders and treasury after 5 seconds
            setTimeout(() => {
              setPhase("founders");
              fetch("/api/founders").then(r => r.json()).then((d: unknown) => { if (Array.isArray(d)) setFounders(d); }).catch(() => {});

              setTimeout(() => {
                setPhase("treasury");
                fetch("/api/treasury/transactions").then(r => r.json()).then((d: unknown) => { if (Array.isArray(d)) setTransactions(d.slice(0, 5) as typeof transactions); }).catch(() => {});

                setTimeout(() => setPhase("complete"), 8000);
              }, 6000);
            }, 5000);
          }, 3000);
        }
      } catch { /* ignore parse errors */ }
    };
  }, []);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── IDLE: Start button ── */}
      {phase === "idle" && (
        <div className="flex min-h-screen items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mb-6">
              <h1 className="text-5xl font-bold">Fund<span className="gradient-text">Flow</span> AI</h1>
              <p className="mt-2 text-gray-400">Autonomous On-Chain Grant Allocator</p>
            </div>
            <button
              onClick={startDemo}
              className="flex items-center gap-3 mx-auto rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white hover:bg-violet-500 transition-all hover:scale-105"
            >
              <Play className="h-6 w-6" />
              Start Live Demo
            </button>
            <p className="mt-4 text-xs text-gray-600">3-minute guided walkthrough with ElevenLabs narration</p>
          </motion.div>
        </div>
      )}

      {/* ── TOUR: Loading ── */}
      {phase === "tour-loading" && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400 mx-auto mb-4" />
            <p className="text-sm text-gray-400">Generating ElevenLabs narration...</p>
          </div>
        </div>
      )}

      {/* ── TOUR: Playing ── */}
      {phase === "tour-playing" && (
        <div className="flex min-h-screen items-center justify-center px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl text-center">
            <div className="mb-8">
              <Volume2 className="h-10 w-10 text-violet-400 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-white mb-2">Guided Tour</h2>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 mb-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tourSubtitle}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-lg text-gray-200 leading-relaxed"
                >
                  {tourSubtitle || "Welcome to FundFlow AI..."}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${tourProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-600">ElevenLabs TTS — 6 sponsor integrations</p>
          </motion.div>
        </div>
      )}

      {/* ── DASHBOARD: Quick flash ── */}
      {phase === "dashboard" && treasury && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <DollarSign className="h-4 w-4 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Treasury</p>
              <p className="text-xl font-bold">{formatUSDC(treasury.usdcBalance)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <TrendingUp className="h-4 w-4 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Vault Yield</p>
              <p className="text-xl font-bold">{formatUSDC(treasury.meteoraYieldEarned)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <FileText className="h-4 w-4 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Proposals</p>
              <p className="text-xl font-bold">{proposals.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Shield className="h-4 w-4 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Audit Records</p>
              <p className="text-xl font-bold">{auditRecords.length} on-chain</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 animate-pulse">Preparing proposal submission...</p>
        </motion.div>
      )}

      {/* ── TYPING: Auto-fill proposal form ── */}
      {phase === "typing-proposal" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Submit Proposal</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title</label>
              <div className="rounded-lg border border-violet-500/30 bg-white/5 px-4 py-3 text-sm text-white">
                {typingField === "title" ? (
                  <TypeWriter text={DEMO_PROPOSAL.title} speed={40} onDone={() => setTypingField("desc")} />
                ) : (
                  DEMO_PROPOSAL.title
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 min-h-[80px]">
                {typingField === "desc" ? (
                  <TypeWriter text={DEMO_PROPOSAL.description} speed={15} onDone={() => setTypingField("amount")} />
                ) : typingField !== "title" ? (
                  DEMO_PROPOSAL.description
                ) : ""}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (USDC)</label>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                  {typingField === "amount" ? (
                    <TypeWriter text="10000" speed={100} onDone={() => setTypingField("wallet")} />
                  ) : typingField !== "title" && typingField !== "desc" ? "10,000" : ""}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Wallet</label>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-mono text-xs">
                  {typingField === "wallet" ? (
                    <TypeWriter text={DEMO_PROPOSAL.applicantWallet} speed={20} onDone={() => { setTypingField("done"); handleTypingDone(); }} />
                  ) : typingField === "done" ? shortenAddress(DEMO_PROPOSAL.applicantWallet, 8) : ""}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SUBMITTING ── */}
      {phase === "submitting" && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400 mx-auto mb-4" />
            <p className="text-sm text-gray-400">Submitting proposal and starting evaluation...</p>
          </div>
        </div>
      )}

      {/* ── EVALUATING: The main show ── */}
      {(phase === "evaluating" || phase === "results") && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="h-5 w-5 text-violet-400" />
            <h2 className="text-xl font-bold">Agent Evaluation Pipeline</h2>
            {phase === "evaluating" && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
            {phase === "results" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left: Steps */}
            <div className="lg:col-span-2 space-y-3">
              {/* Human Check */}
              <div className={cn("rounded-xl border p-4", humanScore !== null ? "border-emerald-500/20 bg-emerald-500/5" : "border-violet-500/30 bg-violet-500/5")}>
                <div className="flex items-center gap-2">
                  {humanScore !== null ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                  <span className="text-sm font-medium">Human Passport Check</span>
                  <span className="ml-auto text-[10px] text-green-400">human.tech</span>
                </div>
                {humanScore !== null && <p className="mt-2 text-xs text-gray-400">Humanity Score: <span className="font-bold text-emerald-400">{humanScore}/100</span></p>}
              </div>

              {/* Reputation */}
              {reputationData && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium">Reputation Score</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {["overall", "platformPresence", "verificationScore", "communityEngagement", "trackRecord", "sentimentScore"].map(k => (
                      <div key={k}>
                        <p className="text-[10px] text-gray-500">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className={cn("text-lg font-bold", Number(reputationData[k] ?? 0) >= 60 ? "text-emerald-400" : Number(reputationData[k] ?? 0) >= 30 ? "text-amber-400" : "text-red-400")}>
                          {Number(reputationData[k] ?? 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Scores */}
              {evalScores && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium">AI Evaluation</span>
                    <span className="ml-auto text-[10px] text-purple-400">GPT-4o</span>
                  </div>
                  <div className="space-y-2">
                    <ScoreBar label="Impact" score={evalScores.impactPotential} delay={0} />
                    <ScoreBar label="Feasibility" score={evalScores.technicalFeasibility} delay={0.1} />
                    <ScoreBar label="Credibility" score={evalScores.teamCredibility} delay={0.2} />
                    <ScoreBar label="Budget" score={evalScores.budgetReasonableness} delay={0.3} />
                    <ScoreBar label="Mission" score={evalScores.missionAlignment} delay={0.4} />
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                      <span className="text-xs font-medium">Overall</span>
                      <span className={cn("text-2xl font-bold", evalScores.overall >= 80 ? "text-emerald-400" : evalScores.overall >= 50 ? "text-amber-400" : "text-red-400")}>
                        {evalScores.overall}/100
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Decision */}
              {evalDecision && (
                <div className={cn("rounded-xl border p-4",
                  evalDecision === "approved" ? "border-emerald-500/20 bg-emerald-500/5" :
                  evalDecision === "rejected" ? "border-red-500/20 bg-red-500/5" :
                  "border-amber-500/20 bg-amber-500/5"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel className="h-4 w-4" />
                    <span className={cn("text-sm font-bold",
                      evalDecision === "approved" ? "text-emerald-400" :
                      evalDecision === "rejected" ? "text-red-400" : "text-amber-400"
                    )}>
                      {evalDecision.toUpperCase()}
                    </span>
                    <span className="ml-auto text-[10px] text-violet-400">ElevenLabs</span>
                  </div>
                  {evalRationale && <p className="text-xs text-gray-400 leading-relaxed">{evalRationale.slice(0, 300)}...</p>}
                </div>
              )}

              {/* On-Chain */}
              {onChainTx && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium">On-Chain</span>
                    <span className="ml-auto text-[10px] text-emerald-400">Solana + Metaplex + Meteora</span>
                  </div>
                  <a href={solanaExplorerUrl(onChainTx)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                    <ExternalLink className="h-3 w-3" /> View on Solana Explorer
                  </a>
                </div>
              )}
            </div>

            {/* Right: Agent Conversation */}
            <div className="lg:col-span-3">
              {agentMessages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">Agent Council Discussion</span>
                    <span className="text-[10px] text-cyan-400">Unbrowse + ElevenLabs</span>
                    {phase === "evaluating" && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <AgentConversation messages={agentMessages} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── FOUNDERS ── */}
      {phase === "founders" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-5 w-5 text-violet-400" />
            <h2 className="text-xl font-bold">Founder Profiles</h2>
            <span className="text-xs text-gray-500">Persistent in PostgreSQL</span>
          </div>
          <div className="space-y-3">
            {founders.slice(0, 5).map(f => (
              <div key={f.wallet} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{f.name ?? shortenAddress(f.wallet, 6)}</p>
                  <p className="text-xs text-gray-500">{f.proposals.length} proposals • ${f.totalFunded.toLocaleString()} funded</p>
                </div>
                <span className={cn("text-lg font-bold", f.reputationScore >= 70 ? "text-emerald-400" : f.reputationScore >= 40 ? "text-amber-400" : "text-red-400")}>
                  {f.reputationScore}/100
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── TREASURY ── */}
      {phase === "treasury" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Landmark className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold">Treasury Ledger</h2>
            <span className="text-xs text-gray-500">Recent transactions</span>
          </div>
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{tx.description.slice(0, 70)}</p>
                  <p className="text-xs text-gray-500">{tx.type}</p>
                </div>
                <span className={cn("text-sm font-bold", ["disbursement", "withdrawal"].includes(tx.type) ? "text-red-400" : "text-emerald-400")}>
                  {["disbursement", "withdrawal"].includes(tx.type) ? "-" : "+"}${tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── COMPLETE ── */}
      {phase === "complete" && (
        <div className="flex min-h-screen items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Fund<span className="gradient-text">Flow</span> AI</h2>
            <p className="text-gray-400 mb-6">Autonomous On-Chain Grant Allocator</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Solana", "Metaplex", "Unbrowse", "ElevenLabs", "Meteora", "human.tech", "GPT-4o", "PostgreSQL"].map(t => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">{t}</span>
              ))}
            </div>
            <p className="mt-6 text-xs text-gray-600">fundflow.ayushojha.com • github.com/Ayush10/fundflow-ai</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
