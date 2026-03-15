# Architecture

## Overview

FundFlow AI is a full-stack autonomous grant allocation system with 6 layers:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Frontend                                       │
│  Next.js 16 · React 19 · Tailwind CSS 4 · Framer Motion │
│  7 pages · SSE streaming · Guided audio tour             │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Multi-Agent Orchestrator                       │
│  5 AI agents · GPT-4o debate · ElevenLabs narration     │
│  Parallel research · Reputation scoring · Risk assess.   │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Integration Layer                              │
│  Unbrowse (6 platforms) · human.tech · ElevenLabs       │
│  OpenAI GPT-4o · Partner database (10 orgs)             │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Blockchain Layer                               │
│  Solana Devnet · Metaplex Core NFTs · Agent Registry    │
│  SPL Token (USDC) · Meteora yield vaults                │
├─────────────────────────────────────────────────────────┤
│  Layer 5: Banking Infrastructure                         │
│  Transaction ledger · 4 fund pools · Milestone tranches │
│  Multi-sig approvals · Treasury alerts · Balance sheet   │
├─────────────────────────────────────────────────────────┤
│  Layer 6: Persistence                                    │
│  PostgreSQL (13 tables) · Write-through cache           │
│  Founder profiles · Audit records · Event history        │
└─────────────────────────────────────────────────────────┘
```

## Evaluation Pipeline

The core pipeline runs sequentially with SSE events streaming to the frontend at every step:

### Step 1: Human Passport Check (human.tech)
- Calls Passport.xyz API with the applicant's wallet address
- Returns a humanity score (0-100)
- Wallets below threshold (configurable, default 20) are **auto-rejected** before any research begins
- Zero-cost Sybil defense: no API calls wasted on bots

### Step 2: Multi-Agent Due Diligence (Unbrowse)
- 5 specialized agents research in parallel:
  - **Scout**: X/Twitter profile + GitHub repos via Unbrowse
  - **Digger**: Reddit mentions + HackerNews posts via Unbrowse
  - **Verifier**: Google search + Y Combinator lookup via Unbrowse
  - **Analyst**: Cross-references findings against partner database and founder history
  - **Judge**: Tallies votes and renders verdict
- Unbrowse browser agent runs locally on port 6969 inside the Docker container
- Each platform gets a targeted extraction intent for structured JSON output

### Step 3: Agent Council Debate (GPT-4o + ElevenLabs)
- GPT-4o generates a natural multi-turn debate script from the research data
- Each agent's key discoveries are narrated via ElevenLabs TTS with distinct voices
- Agents challenge, verify, and agree on findings before voting
- 80%+ council approval required for auto-funding

### Step 4: Reputation Scoring
Composite score from 5 dimensions:
- **Platform Presence** (20%): How many of 6 platforms returned verified data
- **Sentiment** (15%): Average sentiment across found platforms
- **Verification Confidence** (25%): Weighted confidence of each platform result
- **Community Engagement** (15%): Reddit + HackerNews combined
- **Track Record** (25%): GitHub + YC + Google + partner matches + prior history

Historical modifiers:
- +8 per previously approved proposal
- -12 per previously rejected proposal
- Partner database boost: up to +30 for affiliations with YC, Solana Foundation, a16z, etc.

### Step 5: AI Evaluation (GPT-4o)
5 weighted criteria:
- Impact Potential (25%)
- Technical Feasibility (20%)
- Team Credibility (25%)
- Budget Reasonableness (15%)
- Mission Alignment (15%)

Also generates a risk assessment across budget, team, timeline, and market dimensions.

### Step 6: Decision Engine
- **≥ 80%**: Auto-approve with proportional funding (amount × score/100)
- **50-79%**: Flag for human review
- **< 50%**: Auto-reject with rationale

### Step 7: On-Chain Actions
- **Metaplex Core**: Mint immutable NFT with score, rationale, timestamps, wallet
- **Agent Registry**: Register agent identity on-chain
- **SPL Token**: Transfer USDC from treasury to applicant (milestone tranche 1/3)
- **Meteora**: Auto-rebalance vault to maintain 62/38 liquid-to-vault ratio
- **ElevenLabs**: Narrate the verdict

### Step 8: Post-Decision
- Create/update founder profile in PostgreSQL
- Log transaction to treasury ledger
- Update fund pool allocation
- Check multi-sig threshold for large amounts
- Emit activity feed event

## Data Flow

```
User submits proposal (text/voice)
  → API validates with Zod schema
  → Store creates proposal record (in-memory + PostgreSQL)
  → Orchestrator starts evaluation job (singleton per proposal)
  → SSE events stream to connected frontends
  → Each step emits events: running → complete/passed/failed
  → Final decision persisted to store + PostgreSQL
  → On-chain transactions executed on Solana devnet
  → Founder profile created/updated
  → Activity feed updated
```

## File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard
│   ├── proposals/                # Proposal pages
│   ├── treasury/                 # Treasury banking
│   ├── founders/                 # Founder profiles
│   ├── audit/                    # Audit trail
│   ├── demo/                     # Auto-demo page
│   └── api/                      # 24 API endpoints
├── components/
│   ├── tour/                     # Guided audio tour
│   ├── proposals/                # AgentWorkflow, AgentConversation
│   └── ui/                       # SponsorShowcase, DashboardCharts, etc.
├── lib/
│   ├── agent/                    # Orchestrator, evaluator, multi-agent, personas, partners
│   ├── integrations/             # Unbrowse platforms, human-tech
│   ├── solana/                   # Metaplex, treasury, meteora, agent-registry
│   ├── voice/                    # ElevenLabs TTS/STT
│   ├── tour/                     # Tour config and timing
│   ├── db.ts                     # PostgreSQL connection pool
│   ├── persist.ts                # Write-through persistence layer
│   └── store.ts                  # In-memory store with DB hydration
└── types/                        # TypeScript interfaces
```
