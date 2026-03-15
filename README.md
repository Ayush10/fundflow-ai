# FundFlow AI

**Autonomous On-Chain Grant Allocator on Solana**

An AI agent that autonomously evaluates funding proposals, verifies applicant humanity, researches project viability via web APIs, and disburses USDC from a Solana treasury with full on-chain audit trails — while idle funds earn yield on Meteora.

Built for the [Intelligence at the Frontier](https://intelligence-at-the-frontier-hackathon.devspot.app/) hackathon (Funding the Commons x Protocol Labs), March 14-15, 2026.

---

## The Problem

Grant programs and DAOs face three critical challenges:

1. **Manual review bottleneck** — Human reviewers can't keep up with proposal volume. Decisions take weeks, and quality is inconsistent.
2. **Sybil attacks** — Without identity verification, bad actors submit duplicate proposals or use sock puppet accounts to drain treasuries.
3. **Idle capital** — Treasury funds sit earning nothing between disbursements. In DeFi, every dollar should be working.

## The Solution

FundFlow AI replaces the manual review pipeline with an autonomous agent that:

1. **Verifies humanity** — Every applicant must pass a Human Passport check via human.tech before their proposal enters the queue
2. **Researches the applicant** — The agent uses Unbrowse to pull GitHub commit history, LinkedIn employment data, and Twitter community standing
3. **Evaluates with AI** — GPT-4o scores each proposal across 5 weighted criteria and generates a decision rationale
4. **Disburses autonomously** — Approved proposals (score >= 70) trigger automatic USDC transfers. Borderline proposals (50-69) are flagged for human review. Low scores (<50) are auto-rejected.
5. **Logs everything on-chain** — Every decision is minted as a Metaplex Core asset with score, rationale, timestamp, and applicant data
6. **Earns yield on idle funds** — Treasury USDC not actively being disbursed is deposited into Meteora dynamic vaults

---

## How It Works

```
Proposal Submitted (text or voice pitch)
       |
       v
[1. Human Passport Check] --FAIL--> Reject (sybil detected)
       |
      PASS
       |
       v
[2. Unbrowse Research]
  - GitHub: commit frequency, repo stars, languages
  - LinkedIn: headline, employment, connections
  - Twitter/X: follower count, engagement level
       |
       v
[3. AI Evaluation (GPT-4o)]
  Score 0-100 across 5 criteria:
  - Impact potential (25%)
  - Technical feasibility (20%)
  - Team credibility (25%)
  - Budget reasonableness (15%)
  - Mission alignment (15%)
       |
       v
[4. Decision Engine]
  >= 70: Auto-approve + disburse USDC
  50-69: Flag for human review
  < 50:  Auto-reject with rationale
       |
       v
[5. On-Chain Actions]
  - Mint Metaplex Core asset (decision record)
  - Transfer USDC from treasury (if approved)
  - Rebalance Meteora vault (if funds moved)
  - Agent narrates decision via ElevenLabs TTS
```

---

## System Architecture

```
+----------------------------------------------------------+
|          Frontend (Next.js + ElevenLabs Voice)            |
|   Dashboard, proposal submission, voice pitch, audit     |
+---------------------------+------------------------------+
                            |
                            v
+----------------------------------------------------------+
|       Agent Orchestrator (AsyncGenerator Pipeline)       |
|   5-step sequential pipeline with SSE event streaming    |
+----------+----------------+----------------+-------------+
           |                |                |
           v                v                v
  +----------------+ +-------------+ +----------------+
  |  human.tech    | |  Unbrowse   | |  ElevenLabs    |
  |  Sybil-proof   | |  Web data   | |  Voice pitch   |
  |  identity      | |  research   | |  + narration   |
  +----------------+ +-------------+ +----------------+
                            |
                            v
+----------------------------------------------------------+
|            Solana On-Chain Layer (Devnet)                 |
|  +----------------+ +------------------+ +-------------+ |
|  | Metaplex Core  | | SPL Treasury     | | Meteora     | |
|  | audit records  | | USDC escrow      | | yield vault | |
|  +----------------+ +------------------+ +-------------+ |
+----------------------------------------------------------+
```

---

## Features

### AI-Powered Evaluation
- GPT-4o evaluates proposals with structured 5-criteria scoring
- Each criterion scored 0-100 with weighted overall score
- Generates natural language rationale for every decision
- Falls back to heuristic scoring if API is unavailable

### Real-Time Agent Workflow
- Server-Sent Events (SSE) stream each pipeline step to the frontend
- Animated step-by-step visualization: human check -> research -> scoring -> decision -> on-chain
- Scores animate as bars filling up in real-time

### Voice Integration (ElevenLabs)
- **Speech-to-Text**: Applicants record a 2-minute voice pitch via browser microphone
- **Text-to-Speech**: Agent narrates the decision rationale with a selected voice
- Audio player on proposal detail page for narration playback

### Solana Wallet Connect
- Phantom wallet adapter integration
- Connect/disconnect from the navbar
- Auto-fills applicant wallet address on proposal submission

### Treasury Management
- Real-time treasury balance dashboard
- Deposit/withdraw to Meteora yield vault with amount inputs
- Auto-rebalancing after disbursements (62% liquid / 38% vault target)
- Yield accrual tracking

### On-Chain Audit Trail
- Every decision minted as a Metaplex Core asset
- Attributes: score, rationale, timestamp, proposal hash, applicant wallet, decision
- Filterable audit log (approved/rejected/flagged)
- Expandable detail view with Solana Explorer links

### Sybil Resistance
- human.tech Human Passport verification on every applicant
- Minimum Humanity Score threshold (configurable, default 65)
- Blocks bot/sybil wallet addresses

### Applicant Research
- Unbrowse pulls GitHub, LinkedIn, and Twitter data
- Commit frequency, repo stars, top languages
- Employment verification, headline, connections
- Follower count, engagement level
- Research data feeds directly into AI evaluation prompt

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | Dashboard, forms, real-time UI |
| Animations | Framer Motion | Page transitions, score bar animations, workflow steps |
| Icons | Lucide React | Consistent icon system |
| AI Evaluation | OpenAI GPT-4o | Proposal scoring and rationale generation |
| Voice | ElevenLabs API | STT (voice pitch) + TTS (decision narration) |
| Identity | human.tech | Human Passport sybil-resistance |
| Research | Unbrowse | Autonomous web data extraction |
| Blockchain | Solana Web3.js, SPL Token | Treasury management, USDC transfers |
| NFT Audit | Metaplex Core | Decision record minting |
| DeFi Yield | Meteora SDK | Dynamic vault yield optimization |
| Wallet | Solana Wallet Adapter | Phantom/Solflare connection |
| Validation | Zod | API request/response validation |
| Language | TypeScript | End-to-end type safety |

---

## Project Structure

```
fundflow-ai/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Dashboard (stats, recent proposals, audit)
│   │   ├── layout.tsx                # Root layout (wallet provider, navbar, toasts)
│   │   ├── proposals/
│   │   │   ├── page.tsx              # Proposal list with filters
│   │   │   ├── new/page.tsx          # Submit proposal form + voice recorder
│   │   │   └── [id]/page.tsx         # Proposal detail + agent workflow viz
│   │   ├── treasury/page.tsx         # Treasury dashboard + vault actions
│   │   ├── audit/page.tsx            # On-chain audit trail viewer
│   │   └── api/                      # API routes (12 endpoints)
│   │       ├── proposals/            # CRUD + evaluate + SSE stream
│   │       ├── treasury/             # Balance + deposit + withdraw
│   │       ├── audit/                # List + detail by asset address
│   │       └── voice/                # Transcribe (STT) + narrate (TTS)
│   ├── components/
│   │   ├── layout/                   # Navbar, WalletProvider, WalletButton
│   │   ├── proposals/                # AgentWorkflow (the demo showpiece)
│   │   ├── ui/                       # Card, StatusBadge, ScoreBar, StatCard,
│   │   │                             # Toast, LoadingSpinner, ErrorBoundary
│   │   └── voice/                    # VoiceRecorder, NarrationPlayer
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── orchestrator.ts       # 5-step async pipeline with SSE events
│   │   │   └── evaluator.ts          # GPT-4o scoring + heuristic fallback
│   │   ├── integrations/
│   │   │   ├── human-tech.ts         # Human Passport verification
│   │   │   └── unbrowse.ts           # Web research (GitHub/LinkedIn/Twitter)
│   │   ├── solana/
│   │   │   ├── metaplex.ts           # Core asset minting (audit records)
│   │   │   ├── treasury.ts           # USDC disbursement logic
│   │   │   └── meteora.ts            # Yield vault deposit/withdraw/rebalance
│   │   ├── voice/
│   │   │   └── elevenlabs.ts         # ElevenLabs STT + TTS integration
│   │   ├── api.ts                    # Frontend API client (mock/real toggle)
│   │   ├── config.ts                 # Environment config + feature toggles
│   │   ├── store.ts                  # In-memory data store + SSE events
│   │   └── utils.ts                  # Formatting, hashing, color helpers
│   ├── mocks/
│   │   └── data.ts                   # Seed data (5 proposals, 3 audit records)
│   └── types/
│       └── api.ts                    # Shared TypeScript interfaces
├── .env.local.example                # Environment variable template
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/Ayush10/fundflow-ai.git
cd fundflow-ai
npm install
```

### Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API keys:

```env
# Required for AI evaluation
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Required for voice features
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=...

# Optional — each has a simulated fallback
HUMAN_TECH_API_KEY=          # human.tech verification
UNBROWSE_API_KEY=            # web research
SOLANA_PRIVATE_KEY=          # devnet wallet (base58)
TREASURY_WALLET_ADDRESS=     # treasury public key
USDC_MINT_ADDRESS=           # devnet mock USDC mint

# Feature toggles (true = use real API, false = simulated fallback)
ENABLE_REAL_ANTHROPIC=true   # enables GPT-4o evaluation
ENABLE_REAL_ELEVENLABS=true  # enables real TTS/STT
ENABLE_REAL_HUMAN_TECH=false
ENABLE_REAL_UNBROWSE=false
ENABLE_REAL_SOLANA=false
ENABLE_REAL_METEORA=false

# Frontend
NEXT_PUBLIC_USE_MOCK=false   # false = use real API routes
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

Every integration has an independent toggle. You can run the full demo with zero API keys — all integrations fall back to deterministic simulations.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/proposals` | List all proposals |
| `POST` | `/api/proposals` | Submit a new proposal |
| `GET` | `/api/proposals/[id]` | Get proposal with decision |
| `POST` | `/api/proposals/[id]/evaluate` | Trigger agent evaluation pipeline |
| `GET` | `/api/proposals/[id]/stream` | SSE stream of agent workflow events |
| `GET` | `/api/treasury` | Get treasury balance + vault state |
| `POST` | `/api/treasury/deposit` | Deposit USDC to Meteora vault |
| `POST` | `/api/treasury/withdraw` | Withdraw USDC from Meteora vault |
| `GET` | `/api/audit` | List all on-chain audit records |
| `GET` | `/api/audit/[assetAddress]` | Get specific audit record |
| `POST` | `/api/voice/transcribe` | Transcribe voice pitch (STT) |
| `POST` | `/api/voice/narrate` | Generate decision narration (TTS) |

---

## Integration Details

### OpenAI (GPT-4o) — AI Evaluation

The agent sends a structured prompt to GPT-4o containing the full proposal text, human verification data, and Unbrowse research results. GPT-4o returns a JSON object with 5 criterion scores (0-100 each), a weighted overall score, and a natural language rationale.

If the API is unavailable, the evaluator falls back to a heuristic scoring system that uses keyword analysis, research signals, and budget thresholds to generate deterministic scores.

### ElevenLabs — Voice

**STT (Speech-to-Text)**: Uses the `scribe_v1` model. Applicants record a voice pitch in the browser, the audio blob is uploaded and forwarded to ElevenLabs for transcription. The transcript feeds into the AI evaluation.

**TTS (Text-to-Speech)**: Uses the `eleven_multilingual_v2` model. After the agent renders a decision, the rationale text is converted to speech. The MP3 audio is stored as a data URL on the decision record and played back on the proposal detail page.

### human.tech — Sybil Resistance

Verifies that the applicant wallet belongs to a real human using the Human Passport API. Returns a humanity score (0-100) and a verified boolean. Proposals from applicants below the minimum threshold (default 65) are auto-rejected.

### Unbrowse — Web Research

Autonomously researches the applicant's web presence by reverse-engineering GitHub, LinkedIn, and Twitter APIs. Returns structured data (repos, stars, commit frequency, employment, followers, engagement) that feeds directly into the AI evaluation prompt and the team credibility score.

### Metaplex Core — Audit Trail

Every agent decision is minted as a Metaplex Core asset on Solana devnet. Asset attributes store the score, rationale, timestamp, proposal hash, applicant wallet, and decision outcome. These records are immutable, publicly queryable, and form the verifiable audit trail.

### Meteora — Yield Optimization

Idle treasury USDC is auto-deposited into a Meteora dynamic vault. The agent maintains a 62% liquid / 38% vault target allocation, rebalances after each disbursement, and enforces a minimum 9,000 USDC liquid buffer. Yield is tracked and displayed on the treasury dashboard.

---

## Graceful Fallback System

Every external integration has an independent feature toggle and a deterministic fallback:

| Integration | Toggle | Fallback Behavior |
|-------------|--------|-------------------|
| OpenAI | `ENABLE_REAL_ANTHROPIC` | Heuristic scoring based on keywords, research signals, budget |
| ElevenLabs | `ENABLE_REAL_ELEVENLABS` | Silent WAV placeholder + text-based transcript |
| human.tech | `ENABLE_REAL_HUMAN_TECH` | Deterministic score derived from wallet address hash |
| Unbrowse | `ENABLE_REAL_UNBROWSE` | Profile generated from proposal text (languages, keywords) |
| Solana | `ENABLE_REAL_SOLANA` | Simulated signatures, in-memory state |
| Meteora | `ENABLE_REAL_METEORA` | Simulated vault with 0.045% yield per deposit |

The demo always works, even with zero API keys or no internet connectivity.

---

## Demo Flow (3 Minutes)

1. **0:00-0:30** — Problem: manual review waste, sybil attacks, idle treasury funds
2. **0:30-1:00** — Treasury dashboard: USDC balance, Meteora vault earning yield
3. **1:00-1:30** — Submit a proposal (text or voice pitch via ElevenLabs)
4. **1:30-2:00** — Watch the agent work in real-time:
   - Human Passport check (green checkmark)
   - Unbrowse research (GitHub/LinkedIn/Twitter cards appear)
   - AI scoring (bars fill up for each criterion)
5. **2:00-2:30** — Decision rendered: approved, score 84/100. USDC transfers. Decision minted on-chain. Agent narrates the rationale via TTS.
6. **2:30-3:00** — Audit trail: on-chain records. Meteora vault rebalances. Vision: trustless, transparent capital allocation.

---

## Challenge Submissions

### Metaplex Onchain Agent ($5,000)
Every agent decision is minted as a Metaplex Core asset. The audit trail IS the Metaplex integration — each record stores score, rationale, timestamps, and wallet addresses as on-chain attributes. The FundFlow agent is registered in the Metaplex Agent Registry.

### Agentic Funding — Solana ($1,200)
FundFlow is the textbook answer to the track description: an AI agent that holds a budget, evaluates proposals against configurable criteria, moves capital based on verifiable outcomes, and logs everything on-chain.

### Unbrowse Challenge ($1,500)
Novel use case: autonomous due diligence. The agent uses Unbrowse to reverse-engineer GitHub, LinkedIn, and Twitter APIs to build applicant profiles. This is structured data extraction that feeds directly into the AI scoring pipeline.

### Meteora Challenge ($1,000)
Idle treasury USDC is auto-deposited into a Meteora dynamic vault. The agent manages yield strategy autonomously — depositing excess funds, withdrawing for disbursements, maintaining a liquid buffer, and rebalancing after each transaction.

### Made by Human — human.tech ($1,200)
Every applicant must verify via Human Passport before their proposal enters the evaluation queue. This prevents sybil attacks, duplicate submissions, and bot-driven treasury exploitation.

### ElevenLabs Voice Challenge (Credits)
Two-way voice integration: applicants submit voice pitches (STT transcription fed to the AI evaluator), and the agent narrates decision rationales via TTS for dashboard playback.

---

## Builder

**Ayush Ojha**
- Previous hackathon wins: Agent Court (on-chain AI dispute resolution), ArbitrAgent, Orchestra
- 7+ years fintech PM experience (Khalti, Morgan Stanley)
- Stack: Solana/Metaplex, Next.js, TypeScript, AI/LLM integration

---

## License

MIT
