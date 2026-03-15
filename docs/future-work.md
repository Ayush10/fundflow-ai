# FundFlow AI — Future Work

Items identified during the hackathon build that would strengthen the project for production use. Organized by priority and effort.

---

## Cross-Chain Identity (EVM + Solana)

**Problem**: Human Passport (passport.xyz) is EVM-based. Our app accepts Solana wallet addresses. When a Solana address is checked against the Passport API, it returns score 0 because Passport stamps are tied to EVM addresses.

**Solution**:
- Accept both Solana (base58) and EVM (0x) wallet addresses in the proposal form
- Update Zod validation to allow either format
- Allow applicants to link an EVM address for identity verification while using a Solana address for disbursement
- Add a dual-wallet field: "Solana wallet for funding" + "EVM wallet for identity (optional)"
- If an EVM wallet is provided, check Passport score against that; disburse USDC to the Solana wallet

**Impact**: Unlocks real, verifiable humanity scores in the demo. Judges see a non-zero Passport score and can verify it on passport.xyz.

---

## WaaP (Wallet as a Protocol) Integration

**Problem**: WaaP CLI provides 2PC-secured wallets for AI agents (no private key exposure). Currently our agent holds a raw Solana private key in .env. WaaP is EVM-only today.

**Solution (when WaaP supports Solana)**:
- Replace `SOLANA_PRIVATE_KEY` with WaaP CLI calls
- Agent signs Metaplex mints via `waap-cli sign-tx` instead of direct Keypair
- Agent signs USDC transfers via `waap-cli send-tx`
- Policy controls: daily spend limits on the agent wallet
- 2FA for high-value disbursements (email/Telegram approval)

**Solution (today, EVM bridge)**:
- Deploy an EVM version of the treasury on Base or Polygon
- Use WaaP CLI for all signing operations
- Bridge USDC between Solana and EVM via Wormhole when needed

**Impact**: Qualifies for the $6,000 human.tech/WaaP bonus. Demonstrates institutional-grade key management for autonomous agents.

---

## Real Meteora Vault Integration

**Problem**: Meteora dynamic vaults may not have a devnet deployment. Current implementation simulates vault balances, yield accrual, and rebalancing in memory.

**Solution**:
- Deploy on mainnet-beta with real Meteora USDC vault
- Use Meteora SDK for actual deposit/withdraw/rebalance calls
- Track real APY from on-chain vault data
- Implement proper slippage protection on withdrawals

**Fallback already implemented**: Simulation matches the real API surface — deposit, withdraw, rebalance, yield tracking. Switching to real Meteora requires only replacing the function bodies in `src/lib/solana/meteora.ts`.

---

## Persistent Storage

**Problem**: All data (proposals, decisions, audit records, treasury state) lives in an in-memory Map. Server restarts wipe everything. Seed data re-initializes on boot.

**Solution**:
- PostgreSQL database for proposals, decisions, and treasury state
- On-chain data (Metaplex Core assets) as the source of truth for audit records
- Sync on-chain state to DB on startup
- Use Prisma or Drizzle ORM

**Impact**: Production readiness. Multiple server instances. Data survives deployments.

---

## Solana Agent Kit Integration

**Problem**: The project plan specified using `solana-agent-kit` with `plugin-token`, `plugin-nft`, and `plugin-defi`. We used direct SDKs instead (@metaplex-foundation/mpl-core, @solana/spl-token).

**Solution**:
- Register FundFlow agent in the Metaplex Agent Registry via solana-agent-kit
- Use plugin-token for standardized SPL transfers
- Use plugin-nft for Metaplex Core operations
- Use plugin-defi for Meteora vault interactions
- This adds the agent to the on-chain agent registry (important for Metaplex prize)

**Impact**: Stronger Metaplex Onchain Agent submission ($5,000 prize). Agent Registry registration is specifically called out in the prize criteria.

---

## Real Unbrowse Research

**Problem**: Unbrowse CLI requires a browser engine (Kuri) that doesn't work on Windows. On Linux servers it should work.

**Current state**: Integration code calls `localhost:6969` (Unbrowse local server). Falls back to deterministic profiles if server isn't running.

**Solution**:
- Deploy on Linux server with Unbrowse properly installed
- Add caching layer for research results (avoid re-researching same applicant)
- Add LinkedIn research (requires Unbrowse login flow)
- Parse and normalize research data more robustly

**Impact**: $1,500 Unbrowse Challenge prize. Live research data appearing in the demo is dramatically more compelling than simulated profiles.

---

## Enhanced Voice Experience

**Problem**: Voice pitch recording works but transcription falls back to a generated summary when no real audio is uploaded. Narration works via ElevenLabs TTS.

**Solution**:
- Add real-time transcription preview during recording (streaming STT)
- Allow re-recording before submission
- Add voice cloning: agent narrates in a consistent "FundFlow AI" voice
- Add multi-language support for proposals and narration

---

## Governance & Multi-Sig

**Problem**: The agent makes fully autonomous decisions. For production use, high-value disbursements should require multi-sig approval.

**Solution**:
- Configurable approval threshold (e.g., auto-approve < $10K, multi-sig > $10K)
- DAO governance integration: token holders vote on flagged proposals
- Timelock on large disbursements (24-hour delay with cancel option)
- Admin dashboard for human reviewers to approve/reject flagged proposals

---

## Covenant of Humanistic Technologies Alignment

**Problem**: The human.tech $6,000 bonus requires Covenant alignment and a submission to frontier.human.tech.

**Solution**:
- Add a `/covenant` page to the app showing which principles FundFlow embodies:
  - Transparency (on-chain audit trail, open-source)
  - Human verification (sybil resistance)
  - Accountability (every decision has a rationale)
  - Privacy (Human Passport doesn't expose personal data)
  - Autonomy with oversight (flagged proposals go to human review)
- Submit project to frontier.human.tech for community upvotes
- Write a Covenant alignment essay

---

## Production Hardening

- Rate limiting on API routes
- Authentication for admin actions (treasury management)
- HTTPS enforcement
- Error monitoring (Sentry)
- Proper logging (structured JSON logs)
- Health check endpoint
- Graceful shutdown handling
- Database migrations
- CI/CD pipeline (GitHub Actions)
