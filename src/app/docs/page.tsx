"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Layers,
  Plug,
  Users,
  Landmark,
  Code,
  Rocket,
  Play,
  ChevronRight,
  ExternalLink,
  Shield,
  Search,
  Brain,
  Mic,
  Globe,
  Coins,
  Zap,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

type DocSection =
  | "overview"
  | "architecture"
  | "agents"
  | "integrations"
  | "treasury"
  | "api"
  | "deployment";

const NAV_ITEMS: { id: DocSection; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "architecture", label: "Architecture", icon: Layers },
  { id: "agents", label: "Multi-Agent System", icon: Users },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "treasury", label: "Treasury", icon: Landmark },
  { id: "api", label: "API Reference", icon: Code },
  { id: "deployment", label: "Deployment", icon: Rocket },
];

function Badge({ children, color = "bg-white/5 text-gray-400" }: { children: React.ReactNode; color?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${color}`}>{children}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">{children}</h2>;
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-300 mb-2 border-b border-white/5 pb-2">{title}</h3>
      <div className="text-sm text-gray-400 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-black/40 border border-white/5 p-3 text-xs text-gray-300 overflow-x-auto font-mono">
      {children}
    </pre>
  );
}

function ApiRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const colors: Record<string, string> = { GET: "bg-emerald-500/20 text-emerald-400", POST: "bg-blue-500/20 text-blue-400" };
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${colors[method] ?? "bg-gray-500/20 text-gray-400"}`}>{method}</span>
      <code className="text-xs text-cyan-400 font-mono flex-shrink-0">{path}</code>
      <span className="text-xs text-gray-500 truncate">{desc}</span>
    </div>
  );
}

function IntegrationCard({ name, icon: Icon, color, role, children }: { name: string; icon: React.ElementType; color: string; role: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border ${color} p-4 mb-4`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">{name}</h4>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{role}</p>
        </div>
        <Badge color="bg-emerald-500/20 text-emerald-400">LIVE</Badge>
      </div>
      <div className="text-sm text-gray-400 leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState<DocSection>("overview");

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Documentation</h1>
              <p className="text-xs text-gray-500">FundFlow AI — Autonomous On-Chain Grant Allocator</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active === item.id
                      ? "bg-violet-500/10 text-violet-400 font-semibold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-white/5 mt-4">
                <a href="https://github.com/Ayush10/fundflow-ai/tree/master/docs" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 px-3 py-2">
                  <ExternalLink className="h-3 w-3" /> View on GitHub
                </a>
                <Link href="/demo" className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 px-3 py-2">
                  <Play className="h-3 w-3" /> Run Demo
                </Link>
              </div>
            </div>
          </nav>

          {/* Mobile nav */}
          <div className="lg:hidden mb-6 flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={`rounded-full px-3 py-1 text-xs ${active === item.id ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-gray-400"}`}>
                {item.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <motion.div key={active} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 min-w-0">
            {/* ── OVERVIEW ── */}
            {active === "overview" && (
              <div>
                <SectionTitle><Zap className="h-5 w-5 text-violet-400" /> Overview</SectionTitle>
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 mb-6">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    FundFlow AI is an autonomous treasury infrastructure where <strong className="text-white">5 AI agents</strong> collaboratively
                    evaluate grant proposals, verify founder identities, research applicant credentials across <strong className="text-white">6 web platforms</strong>,
                    debate findings with <strong className="text-white">ElevenLabs voice narration</strong>, and execute <strong className="text-white">USDC disbursements on Solana</strong>.
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed mt-3">
                    Every decision is minted as an immutable <strong className="text-white">Metaplex Core NFT</strong>. Idle treasury funds earn yield
                    via <strong className="text-white">Meteora</strong> dynamic vaults. The system includes banking-grade treasury management with transaction
                    ledger, fund pools, milestone-based funding, and multi-sig approvals.
                  </p>
                </div>

                <SubSection title="What Makes This Novel">
                  <p>This is not a dashboard or chatbot. The agents <strong className="text-white">take action</strong>:</p>
                  <ul className="list-none space-y-1.5 mt-2">
                    {[
                      "Vote on proposals (4-agent council with 80% threshold)",
                      "Move real funds (USDC SPL token transfers on Solana devnet)",
                      "Research applicants (Unbrowse browser agent across 6 platforms)",
                      "Explain their reasoning (GPT-4o debate + ElevenLabs narration)",
                      "Log everything on-chain (Metaplex Core NFT audit trail)",
                      "Earn yield autonomously (Meteora vault with auto-rebalancing)",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </SubSection>

                <SubSection title="Challenge Tracks">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { name: "Metaplex Onchain Agent", prize: "$5,000", color: "border-emerald-500/20 bg-emerald-500/5" },
                      { name: "Unbrowse Challenge", prize: "$1,500", color: "border-cyan-500/20 bg-cyan-500/5" },
                      { name: "Solana: Agentic Funding", prize: "$1,200", color: "border-blue-500/20 bg-blue-500/5" },
                      { name: "Made by Human (human.tech)", prize: "$1,200", color: "border-green-500/20 bg-green-500/5" },
                      { name: "Meteora Challenge", prize: "$1,000", color: "border-amber-500/20 bg-amber-500/5" },
                    ].map((t) => (
                      <div key={t.name} className={`rounded-lg border ${t.color} px-3 py-2 flex items-center justify-between`}>
                        <span className="text-xs text-gray-300">{t.name}</span>
                        <span className="text-xs font-bold text-white">{t.prize}</span>
                      </div>
                    ))}
                  </div>
                </SubSection>
              </div>
            )}

            {/* ── ARCHITECTURE ── */}
            {active === "architecture" && (
              <div>
                <SectionTitle><Layers className="h-5 w-5 text-blue-400" /> Architecture</SectionTitle>
                <img src="/architecture.svg" alt="FundFlow AI Architecture" className="w-full rounded-xl border border-white/10 mb-6" />

                <SubSection title="Evaluation Pipeline">
                  <div className="space-y-2">
                    {[
                      { step: "1", title: "Human Passport Check", desc: "Sybil detection via human.tech", color: "text-green-400" },
                      { step: "2", title: "Multi-Agent Research", desc: "5 agents, 6 platforms via Unbrowse", color: "text-cyan-400" },
                      { step: "3", title: "Agent Council Debate", desc: "GPT-4o dialogue + ElevenLabs narration", color: "text-violet-400" },
                      { step: "4", title: "Reputation Scoring", desc: "5-dimension composite from all platforms", color: "text-amber-400" },
                      { step: "5", title: "AI Evaluation", desc: "GPT-4o: 5 criteria + risk assessment", color: "text-purple-400" },
                      { step: "6", title: "Decision Engine", desc: "80%+ approve, 50-79 flag, <50 reject", color: "text-white" },
                      { step: "7", title: "On-Chain Actions", desc: "Metaplex NFT + USDC transfer + Meteora rebalance", color: "text-emerald-400" },
                    ].map((s) => (
                      <div key={s.step} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-bold ${s.color}`}>{s.step}</span>
                        <div>
                          <p className="text-xs font-semibold text-white">{s.title}</p>
                          <p className="text-[10px] text-gray-500">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SubSection>

                <SubSection title="Data Flow">
                  <CodeBlock>{`User submits proposal (text/voice)
  → Zod validation → Store (memory + PostgreSQL)
  → Orchestrator starts (singleton per proposal)
  → SSE events stream to frontend
  → Each step: running → complete
  → Decision persisted + on-chain TX
  → Founder profile updated
  → Activity feed emitted`}</CodeBlock>
                </SubSection>
              </div>
            )}

            {/* ── AGENTS ── */}
            {active === "agents" && (
              <div>
                <SectionTitle><Users className="h-5 w-5 text-orange-400" /> Multi-Agent System</SectionTitle>

                <SubSection title="Agent Council">
                  <div className="space-y-2">
                    {[
                      { emoji: "🔍", name: "Scout", role: "Social Intelligence", platforms: "X/Twitter + GitHub", voice: "Rachel", color: "border-blue-500/20 bg-blue-500/5" },
                      { emoji: "⛏️", name: "Digger", role: "Community Researcher", platforms: "Reddit + HackerNews", voice: "Antoni", color: "border-orange-500/20 bg-orange-500/5" },
                      { emoji: "✅", name: "Verifier", role: "Credential Checker", platforms: "Google + Y Combinator", voice: "Arnold", color: "border-green-500/20 bg-green-500/5" },
                      { emoji: "📊", name: "Analyst", role: "Data Synthesizer", platforms: "Cross-ref + Partners", voice: "Adam", color: "border-purple-500/20 bg-purple-500/5" },
                      { emoji: "⚖️", name: "Judge", role: "Final Arbiter", platforms: "Verdict + Funding", voice: "Custom", color: "border-amber-500/20 bg-amber-500/5" },
                    ].map((a) => (
                      <div key={a.name} className={`rounded-lg border ${a.color} p-3 flex items-center gap-3`}>
                        <span className="text-xl">{a.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{a.name} <span className="text-xs font-normal text-gray-500">— {a.role}</span></p>
                          <p className="text-xs text-gray-500">{a.platforms} · Voice: {a.voice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SubSection>

                <SubSection title="Reputation Formula">
                  <CodeBlock>{`Overall = Platform Presence (20%)
        + Sentiment (15%)
        + Verification Confidence (25%)
        + Community Engagement (15%)
        + Track Record (25%)

Modifiers:
  Partner match: up to +30
  Past approval: +8 each
  Past rejection: -12 each`}</CodeBlock>
                </SubSection>

                <SubSection title="Partner Database (10 Organizations)">
                  <div className="grid grid-cols-2 gap-1">
                    {["Y Combinator (95)", "a16z Crypto (92)", "Solana Foundation (90)", "Ethereum Foundation (88)", "Optimism RetroPGF (85)", "Uniswap Foundation (82)", "Protocol Labs (80)", "Aave Grants (78)", "Gitcoin (75)", "Superteam (70)"].map((p) => (
                      <div key={p} className="text-xs text-gray-400 rounded bg-white/[0.02] px-2 py-1">{p}</div>
                    ))}
                  </div>
                </SubSection>
              </div>
            )}

            {/* ── INTEGRATIONS ── */}
            {active === "integrations" && (
              <div>
                <SectionTitle><Plug className="h-5 w-5 text-cyan-400" /> Sponsor Integrations (7 Live)</SectionTitle>

                <IntegrationCard name="Unbrowse" icon={Search} color="border-cyan-500/20 bg-cyan-500/5" role="Browser Agent — $1,500 Challenge">
                  <p>Autonomous web research via browser agent on port 6969. Scrapes 6 platforms in parallel with targeted extraction intents.</p>
                  <p className="text-xs text-gray-500 mt-1">Files: <code>src/lib/integrations/platforms.ts</code>, <code>src/lib/integrations/unbrowse.ts</code></p>
                </IntegrationCard>

                <IntegrationCard name="Solana + Metaplex" icon={Shield} color="border-emerald-500/20 bg-emerald-500/5" role="On-Chain Agent — $5,000 Challenge">
                  <p>Agent Registry identity + Core NFT audit trail + SPL USDC disbursements. All verifiable on Solana Explorer.</p>
                  <p className="text-xs text-gray-500 mt-1">Files: <code>src/lib/solana/agent-registry.ts</code>, <code>src/lib/solana/metaplex.ts</code>, <code>src/lib/solana/treasury.ts</code></p>
                </IntegrationCard>

                <IntegrationCard name="Meteora" icon={Coins} color="border-amber-500/20 bg-amber-500/5" role="DeFi Yield — $1,000 Challenge">
                  <p>Idle USDC auto-deposited into dynamic vaults (~4.5% APY). 62/38 liquid-to-vault ratio with $9K minimum buffer.</p>
                  <p className="text-xs text-gray-500 mt-1">File: <code>src/lib/solana/meteora.ts</code></p>
                </IntegrationCard>

                <IntegrationCard name="ElevenLabs" icon={Mic} color="border-violet-500/20 bg-violet-500/5" role="Multi-Voice AI Narration">
                  <p>5 distinct agent voices. Per-agent narration on key discoveries. Verdict narration. Guided tour generation. STT transcription.</p>
                  <p className="text-xs text-gray-500 mt-1">File: <code>src/lib/voice/elevenlabs.ts</code></p>
                </IntegrationCard>

                <IntegrationCard name="human.tech" icon={Globe} color="border-green-500/20 bg-green-500/5" role="Sybil Resistance — $1,200 Challenge">
                  <p>Passport.xyz API with scorer ID. Wallets below threshold rejected before due diligence. Zero-cost Sybil defense.</p>
                  <p className="text-xs text-gray-500 mt-1">File: <code>src/lib/integrations/human-tech.ts</code></p>
                </IntegrationCard>

                <IntegrationCard name="GPT-4o" icon={Brain} color="border-purple-500/20 bg-purple-500/5" role="AI Evaluation + Debate">
                  <p>5-criteria scoring + natural debate generation + risk assessment. Reputation-aware prompting.</p>
                  <p className="text-xs text-gray-500 mt-1">Files: <code>src/lib/agent/evaluator.ts</code>, <code>src/lib/agent/multi-agent.ts</code></p>
                </IntegrationCard>
              </div>
            )}

            {/* ── TREASURY ── */}
            {active === "treasury" && (
              <div>
                <SectionTitle><Landmark className="h-5 w-5 text-amber-400" /> Treasury & Banking</SectionTitle>

                <SubSection title="Banking Features">
                  <ul className="list-none space-y-1.5">
                    {[
                      "Transaction ledger — deposits, withdrawals, disbursements, yield, rebalances",
                      "4 fund allocation pools — DeFi, Public Goods, Research, Community",
                      "Milestone-based funding — 3 tranches (30/30/40%)",
                      "Multi-sig approvals — 2-of-N for disbursements >$15K",
                      "Treasury alerts — low balance, pool depletion, yield harvest",
                      "Auto-rebalance — 62% liquid / 38% vault target",
                      "Balance sheet — total assets, by-pool breakdown, yield tracking",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-amber-400 mt-1 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </SubSection>

                <SubSection title="Milestone Tranches">
                  <div className="space-y-1">
                    {[
                      { phase: "Phase 1: Setup", pct: "30%", status: "Auto-disbursed on approval" },
                      { phase: "Phase 2: Development", pct: "30%", status: "Requires milestone verification" },
                      { phase: "Phase 3: Launch", pct: "40%", status: "Requires milestone verification" },
                    ].map((m) => (
                      <div key={m.phase} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                        <span className="text-xs text-white">{m.phase} <span className="text-gray-500">({m.pct})</span></span>
                        <span className="text-[10px] text-gray-500">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </SubSection>
              </div>
            )}

            {/* ── API ── */}
            {active === "api" && (
              <div>
                <SectionTitle><Code className="h-5 w-5 text-cyan-400" /> API Reference (24 Endpoints)</SectionTitle>

                <SubSection title="Proposals">
                  <ApiRow method="GET" path="/api/proposals" desc="List all proposals" />
                  <ApiRow method="POST" path="/api/proposals" desc="Submit new proposal" />
                  <ApiRow method="GET" path="/api/proposals/[id]" desc="Get proposal + decision" />
                  <ApiRow method="POST" path="/api/proposals/[id]/evaluate" desc="Trigger multi-agent evaluation" />
                  <ApiRow method="GET" path="/api/proposals/[id]/stream" desc="SSE event stream" />
                  <ApiRow method="GET" path="/api/proposals/[id]/report" desc="Due diligence report" />
                  <ApiRow method="GET" path="/api/proposals/[id]/comments" desc="List comments" />
                  <ApiRow method="POST" path="/api/proposals/[id]/comments" desc="Add comment" />
                  <ApiRow method="GET" path="/api/proposals/[id]/milestones" desc="List milestones" />
                  <ApiRow method="POST" path="/api/proposals/[id]/milestones" desc="Verify milestone" />
                </SubSection>

                <SubSection title="Treasury">
                  <ApiRow method="GET" path="/api/treasury" desc="Balance + vault state" />
                  <ApiRow method="POST" path="/api/treasury/deposit" desc="Deposit to Meteora vault" />
                  <ApiRow method="POST" path="/api/treasury/withdraw" desc="Withdraw from vault" />
                  <ApiRow method="GET" path="/api/treasury/transactions" desc="Transaction ledger" />
                  <ApiRow method="GET" path="/api/treasury/pools" desc="Fund allocation pools" />
                  <ApiRow method="GET" path="/api/treasury/alerts" desc="Treasury health alerts" />
                  <ApiRow method="GET" path="/api/treasury/approvals" desc="Multi-sig queue" />
                  <ApiRow method="POST" path="/api/treasury/approvals" desc="Approve request" />
                </SubSection>

                <SubSection title="Founders, Audit, Agent, Activity">
                  <ApiRow method="GET" path="/api/founders" desc="All founder profiles" />
                  <ApiRow method="GET" path="/api/founders/[wallet]" desc="Founder detail" />
                  <ApiRow method="GET" path="/api/audit" desc="On-chain audit records" />
                  <ApiRow method="GET" path="/api/audit/[addr]" desc="Audit by Metaplex asset" />
                  <ApiRow method="GET" path="/api/agent" desc="Check agent registration" />
                  <ApiRow method="POST" path="/api/agent" desc="Register agent on-chain" />
                  <ApiRow method="GET" path="/api/activity" desc="Live activity feed" />
                  <ApiRow method="GET" path="/api/tour" desc="Guided tour audio" />
                </SubSection>
              </div>
            )}

            {/* ── DEPLOYMENT ── */}
            {active === "deployment" && (
              <div>
                <SectionTitle><Rocket className="h-5 w-5 text-red-400" /> Deployment</SectionTitle>

                <SubSection title="Production Stack">
                  <div className="space-y-1">
                    {[
                      { label: "Runtime", value: "Docker (node:22-bookworm-slim + Chromium)" },
                      { label: "Platform", value: "Coolify on VPS" },
                      { label: "Database", value: "PostgreSQL (13 tables)" },
                      { label: "Proxy", value: "Traefik (auto-SSL)" },
                      { label: "Domain", value: "fundflow.ayushojha.com" },
                      { label: "Deploy", value: "Auto-deploy on push to master" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                        <span className="text-xs text-gray-500">{r.label}</span>
                        <span className="text-xs text-white">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </SubSection>

                <SubSection title="Quick Start">
                  <CodeBlock>{`git clone https://github.com/Ayush10/fundflow-ai.git
cd fundflow-ai
npm install
cp .env.local.example .env.local
npm run dev`}</CodeBlock>
                  <p className="mt-2">Every integration has an independent toggle. Works with zero API keys.</p>
                </SubSection>

                <SubSection title="PostgreSQL Schema">
                  <p>13 tables with write-through cache pattern:</p>
                  <CodeBlock>{`proposals          human_verifications    research_results
agent_events       audit_records          treasury_state
treasury_transactions  fund_pools         founders
founder_proposals  milestones`}</CodeBlock>
                </SubSection>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
