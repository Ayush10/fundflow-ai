# FundFlow AI — Pitch Guide

## 30-Second Elevator Pitch

> "FundFlow AI is an autonomous grant allocator on Solana. Five AI agents research every applicant across six web platforms, debate their findings with voice narration, vote on whether to fund, and then execute real USDC transfers on-chain — all without human intervention. Every decision is minted as an immutable Metaplex NFT. Idle treasury funds earn yield on Meteora. The whole system is live at fundflow.ayushojha.com."

---

## Sponsor-Specific Pitches

### Talking to Solana people ($1,200)

**What they care about**: Agents that actually transact on-chain, not just dashboards.

> "FundFlow agents don't just analyze — they move money. Every approved proposal triggers a real USDC SPL token transfer from the treasury wallet to the applicant. The agent registers itself on-chain via Metaplex Agent Registry. Every decision is an immutable Core NFT. The treasury auto-rebalances between liquid USDC and a Meteora yield vault after every disbursement."

**Show them**:
1. Dashboard → point out the on-chain status card (agent registered, treasury wallet, USDC mint)
2. Trigger an evaluation → watch the on-chain step (minting, transferring, rebalancing)
3. Click the Solana Explorer link to verify the real transaction
4. Treasury page → show the transaction ledger with real tx hashes

**Key phrase**: *"The agents take action — they're not just reading the chain, they're writing to it."*

---

### Talking to Metaplex people ($5,000 — biggest prize)

**What they care about**: Agent Registry usage, Core NFT utility, not just "we imported the SDK."

> "We use Metaplex in three ways. First, the FundFlow agent registers its identity on-chain via the Agent Registry — it's a first-class on-chain entity. Second, every grant decision is minted as a Core NFT with on-chain attributes: score, rationale, timestamps, applicant wallet, and decision type. Third, the decision NFTs form an immutable, publicly queryable audit trail — anyone can verify why a proposal was funded or rejected by reading the asset attributes on Explorer."

**Show them**:
1. Click "Register Agent" on the dashboard → show the agent asset address on Explorer
2. Go to Audit Trail → click any record → show the Metaplex Core asset on Explorer
3. Point out the attributes tab: score, decision, proposalId, rationale, timestamp
4. Explain: "This isn't a profile picture NFT — it's a verifiable decision record"

**Key phrase**: *"The NFT IS the audit trail. Every decision permanently on-chain with structured attributes."*

---

### Talking to Unbrowse people ($1,500)

**What they care about**: Novel use case beyond basic scraping, autonomous decision-making.

> "We use Unbrowse as the backbone of our due diligence system. Five AI agents make parallel requests to the local Unbrowse server, each with targeted extraction intents across six platforms — Twitter, GitHub, Reddit, HackerNews, Google, and Y Combinator. The structured JSON responses feed directly into a reputation scoring algorithm that determines whether a real startup gets funded or a fake one gets rejected. This is autonomous due diligence — the agents don't just browse, they act on what they find."

**Show them**:
1. Submit a proposal with real GitHub/Twitter handles
2. Watch the multi-agent conversation stream — "Scout found them on X!", "Digger: community presence detected!"
3. Show the reputation score breakdown: platform presence, sentiment, verification, community, track record
4. Point out: "Unbrowse is running inside our Docker container with Chromium on port 6969"
5. Show a rejection: "This applicant had no web presence — the agents couldn't verify them, so zero funds moved"

**Key phrase**: *"Unbrowse turns the web into structured intelligence that autonomous agents act on."*

---

### Talking to Meteora people ($1,000)

**What they care about**: Vault usage, yield strategy, not just "we mentioned Meteora."

> "Our treasury uses Meteora as its yield engine. Idle USDC is automatically deposited into a dynamic vault earning ~4.5% APY. The system maintains a 62/38 liquid-to-vault ratio with a $9,000 minimum buffer. After every disbursement, it auto-rebalances — if a grant approval would drop the liquid balance below the buffer, it withdraws from the vault first. Yield accrual is tracked daily in our transaction ledger."

**Show them**:
1. Treasury page → Balance cards showing vault balance and yield earned
2. Transaction ledger → point out "yield", "deposit", "rebalance" entries
3. Trigger an evaluation → watch the "rebalancing Meteora vault" step in the agent workflow
4. Balance sheet at the bottom → total assets breakdown

**Key phrase**: *"The AI agents manage the yield strategy autonomously — deposit, withdraw, rebalance, all programmatic."*

---

### Talking to human.tech people ($1,200)

**What they care about**: Real Passport integration, Sybil defense that matters.

> "Human Passport is our first line of defense. Before any AI evaluation or research happens — before we spend a single API call — every applicant wallet is checked against Passport.xyz. If the humanity score is below our threshold, the proposal is instantly rejected. Zero cost. We had a test submission called 'Definitely Not a Scam Token' — humanity score 12, auto-rejected before any agent even looked at it. That's the power: Sybil defense at zero marginal cost."

**Show them**:
1. Go to the Sybil bot proposal → show score 8/100, "rejected at Human Passport stage"
2. Show a successful check → humanity score 87, green checkmark, evaluation proceeds
3. Explain: "The threshold is configurable. Right now it's 20. A real DAO could set it to 50 or 65."
4. Founders page → show the bot wallet with rep score 0, zero funded

**Key phrase**: *"Passport is the gate. Bad actors never reach the expensive parts of the pipeline."*

---

### Talking to ElevenLabs people

**What they care about**: Creative voice usage, not just basic TTS.

> "We have five AI agents, each with a distinct ElevenLabs voice. During due diligence, Scout narrates when she finds someone on Twitter, Digger speaks when he discovers Reddit mentions, and the Judge delivers the final verdict — all in different voices, streamed in real-time. We also generate a full guided audio tour of the dashboard dynamically via ElevenLabs TTS, and applicants can submit voice pitches transcribed via the STT API."

**Show them**:
1. Trigger an evaluation → listen to the agent narrations as they stream in
2. Play the guided tour from `/demo` — full ElevenLabs-narrated walkthrough
3. Show the proposal submission form with the voice recorder
4. Each agent voice is labeled in the AgentWorkflow component

**Key phrase**: *"Five distinct voices debating a funding decision in real-time — that's never been done before."*

---

## Demo Flows

### 3 Minutes (Auto-Demo)
1. Open `https://fundflow.ayushojha.com/demo`
2. Click "Start Live Demo"
3. Talk over it while the tour plays and agents evaluate

### 60 Seconds (Speed Run)
1. Open dashboard → "This is a $230K treasury managed by AI agents"
2. Go to a proposal → "Watch 5 agents debate whether to fund this"
3. Point at the agent conversation → "They're researching GitHub, Twitter, Reddit, HN, Google, and YC simultaneously via Unbrowse"
4. Point at the decision → "84/100, auto-approved, USDC transferred, Metaplex NFT minted"
5. Open Solana Explorer → "Verify it yourself"

### "Is This Real?" Proof Points
- Show the Solana Explorer transaction
- Show the PostgreSQL founder profiles (data persists across restarts)
- Show the Unbrowse health check (port 6969 running)
- Show the ElevenLabs audio playing

---

## Questions You'll Get

**"Is this a new build?"**
> "Yes, built from scratch during this hackathon. You can check the git history — first commit was March 14."

**"Does it actually move real money?"**
> "Yes, on Solana devnet. Real USDC SPL token transfers. We could switch to mainnet by changing one environment variable."

**"What happens if the AI makes a bad decision?"**
> "Three safeguards: milestone-based funding (only 30% upfront), multi-sig approvals for large amounts, and the 80% threshold means agents need strong consensus."

**"How is this different from just using ChatGPT to review proposals?"**
> "ChatGPT reads text. Our agents take action — they research the founder across 6 platforms, verify their humanity, debate with each other, vote, and then move actual funds on-chain. The decision is permanent, immutable, and auditable."

**"What's the tech stack?"**
> "Next.js 16, React 19, TypeScript, Solana Web3.js, Metaplex Core + Agent Registry, Meteora, Unbrowse, ElevenLabs, GPT-4o, PostgreSQL. Deployed via Docker on Coolify."

**"Could this work on mainnet?"**
> "Yes. Change the RPC URL and fund the treasury wallet with real USDC. The code is chain-agnostic between devnet and mainnet."

---

## Links

- **Live App**: [fundflow.ayushojha.com](https://fundflow.ayushojha.com)
- **Auto Demo**: [fundflow.ayushojha.com/demo](https://fundflow.ayushojha.com/demo)
- **Docs**: [fundflow.ayushojha.com/docs](https://fundflow.ayushojha.com/docs)
- **GitHub**: [github.com/Ayush10/fundflow-ai](https://github.com/Ayush10/fundflow-ai)
- **Architecture**: [github.com/Ayush10/fundflow-ai/blob/master/public/architecture.svg](https://github.com/Ayush10/fundflow-ai/blob/master/public/architecture.svg)
