# Sponsor Integrations

FundFlow AI integrates 7 sponsor technologies. Each is deeply woven into the autonomous pipeline — not surface-level imports.

---

## 1. Unbrowse — Browser Agent

**Challenge**: Unbrowse Challenge ($1,500)
**Role**: Autonomous web research across 6 platforms
**Status**: Live (Chromium + Unbrowse CLI running inside Docker container on port 6969)

### How It Works
The Unbrowse CLI runs as a background service inside the Docker container. When the multi-agent orchestrator needs to research an applicant, each agent makes `POST /resolve` calls to `localhost:6969` with targeted extraction intents.

### Platforms Researched
| Platform | Agent | Intent |
|----------|-------|--------|
| X/Twitter | Scout | Profile, followers, bio, recent posts |
| GitHub | Scout | Repos, stars, languages, contributions, bio |
| Reddit | Digger | Mentions, upvotes, karma |
| HackerNews | Digger | Posts, points, Show HN |
| Google | Verifier | Search results, news, press |
| Y Combinator | Verifier | Company, batch, description |

### Code
- `src/lib/integrations/platforms.ts` — 6 platform-specific functions
- `src/lib/integrations/unbrowse.ts` — Original 3-platform research
- `src/lib/agent/multi-agent.ts` — Parallel orchestration

### Novel Contribution
Autonomous due diligence via browser agent. This is **structured data extraction for on-chain grant evaluation** — not just browsing, but acting on findings to determine funding decisions.

---

## 2. Solana — Blockchain Infrastructure

**Challenge**: Agentic Funding & Coordination ($1,200)
**Role**: Treasury management, USDC transfers, transaction settlement
**Status**: Live on Solana Devnet

### How It Works
- Treasury wallet holds USDC (SPL Token)
- Approved proposals trigger real `transfer()` calls via `@solana/spl-token`
- Every transaction is verifiable on Solana Explorer
- Keypair derived from `SOLANA_PRIVATE_KEY` environment variable

### Code
- `src/lib/solana.ts` — Connection, keypair, public keys
- `src/lib/solana/treasury.ts` — USDC disbursement with balance checks

---

## 3. Metaplex — On-Chain Agent Identity & Audit Trail

**Challenge**: Metaplex Onchain Agent ($5,000)
**Role**: Agent registration + immutable NFT decision records
**Status**: Live (Agent Registry + Core NFT minting on devnet)

### Agent Registry
FundFlow AI registers itself as an on-chain agent via `registerIdentityV1` from `@metaplex-foundation/mpl-agent-registry`. The agent asset address is stored and displayed in the dashboard's OnChainStatus component.

### Core NFT Audit Trail
Every grant decision is minted as a Metaplex Core asset with on-chain attributes:
- `score` — overall evaluation score (0-100)
- `decision` — approved, rejected, or flagged
- `proposalId` — unique proposal identifier
- `proposalHash` — SHA-256 hash of title + description
- `applicantWallet` — applicant's Solana address
- `timestamp` — ISO 8601 decision timestamp
- `rationale` — first 200 chars of the AI-generated rationale

### Code
- `src/lib/solana/agent-registry.ts` — Agent registration
- `src/lib/solana/metaplex.ts` — Core asset minting with attributes

---

## 4. Meteora — DeFi Yield Optimization

**Challenge**: Meteora Challenge ($1,000)
**Role**: Earn yield on idle treasury funds
**Status**: Live (simulated vault with real rebalancing logic)

### How It Works
- Treasury maintains a 62% liquid / 38% vault target allocation
- $9,000 minimum liquid buffer enforced at all times
- After each disbursement, the system auto-rebalances
- If a disbursement exceeds liquid balance, funds are withdrawn from vault first
- Yield accrual tracked daily in the transaction ledger (~4.5% APY)

### Code
- `src/lib/solana/meteora.ts` — Deposit, withdraw, rebalance, yield tracking

---

## 5. ElevenLabs — Multi-Voice AI Narration

**Role**: Voice AI for agent narration and guided tour
**Status**: Live (5 distinct voices)

### Features
- **5 agent voices**: Each agent persona has a unique ElevenLabs voice ID
  - Scout: Rachel (21m00Tcm4TlvDq8ikWAM)
  - Digger: Antoni (ErXwobaYiN019PkySvjV)
  - Verifier: Arnold (VR6AewLTigWG4xSOukaG)
  - Analyst: Adam (pNInz6obpgDQGcFmaJgB)
  - Judge: Custom voice (Tu2hPdmCr8ZkKfSFXWyj)
- **Per-agent narration**: Key discovery moments narrated by the discovering agent
- **Verdict narration**: Judge delivers the final decision via TTS
- **STT transcription**: Voice pitch proposals transcribed via `scribe_v1`
- **Guided tour**: Full dashboard narration generated dynamically

### Code
- `src/lib/voice/elevenlabs.ts` — TTS, STT, narrateShort()
- `src/app/api/tour/route.ts` — Tour audio generation

---

## 6. human.tech (Passport) — Sybil Resistance

**Challenge**: Made by Human ($1,200)
**Role**: Pre-screening identity verification
**Status**: Live (Passport.xyz API with scorer ID 11966)

### How It Works
- Every applicant wallet is checked against the Gitcoin Passport API
- Returns a humanity score (0-100) based on on-chain stamps
- Wallets below the threshold (configurable, currently 20) are rejected BEFORE any due diligence
- This means Sybil attacks cost zero — no AI, no Unbrowse, no on-chain actions wasted

### Code
- `src/lib/integrations/human-tech.ts` — Passport.xyz API call with fallback

---

## 7. OpenAI GPT-4o — AI Evaluation & Debate

**Role**: Proposal scoring + multi-agent debate generation
**Status**: Live

### How It Works
- Evaluates proposals across 5 weighted criteria (0-100 each)
- Generates a natural language rationale for every decision
- Generates multi-agent debate scripts from research data
- Risk assessment across 4 dimensions (budget, team, timeline, market)
- Reputation-aware: feeds platform data and partner matches into the prompt

### Code
- `src/lib/agent/evaluator.ts` — Scoring engine + heuristic fallback
- `src/lib/agent/multi-agent.ts` — Debate script generation
