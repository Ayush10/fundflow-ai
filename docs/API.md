# API Reference

Base URL: `https://fundflow.ayushojha.com`

All endpoints use `Content-Type: application/json`. All responses are JSON.

---

## Proposals

### `GET /api/proposals`
List all proposals, sorted by creation date (newest first).

**Response**: `Proposal[]`

### `POST /api/proposals`
Submit a new proposal.

**Body**:
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "requestedAmount": "number (required, USDC)",
  "applicantWallet": "string (required, Solana address)",
  "transcript": "string (optional, voice pitch text)",
  "voicePitchUrl": "string (optional)"
}
```

**Response**: `Proposal` (status: "pending")

### `GET /api/proposals/[id]`
Get a specific proposal with its decision (if evaluated).

### `POST /api/proposals/[id]/evaluate`
Trigger the multi-agent evaluation pipeline. Returns immediately with 202-like response. Subscribe to SSE stream for real-time updates.

**Response**: `{ proposalId, status: "evaluation_started" }`

### `GET /api/proposals/[id]/stream`
Server-Sent Events stream of agent workflow events. Each event is a JSON `AgentEvent` object.

### `GET /api/proposals/[id]/report`
Get the full due diligence report as JSON (used for PDF generation).

### `GET /api/proposals/[id]/comments`
List judge comments/notes for a proposal.

### `POST /api/proposals/[id]/comments`
Add a comment. Body: `{ "author": "string", "text": "string" }`

### `GET /api/proposals/[id]/milestones`
List milestones for an approved proposal.

### `POST /api/proposals/[id]/milestones`
Verify a milestone. Body: `{ "milestoneId": "string" }`

---

## Treasury

### `GET /api/treasury`
Get current treasury state (balance, vault, yield, disbursed).

### `POST /api/treasury/deposit`
Deposit USDC to Meteora vault. Body: `{ "amount": number }`

### `POST /api/treasury/withdraw`
Withdraw USDC from vault. Body: `{ "amount": number }`

### `GET /api/treasury/transactions`
Full transaction ledger (deposits, withdrawals, disbursements, yield, rebalances).

### `GET /api/treasury/pools`
Fund allocation pools with disbursed/allocated amounts.

### `GET /api/treasury/alerts`
Treasury health alerts (critical, warning, info).

### `GET /api/treasury/approvals`
Multi-sig approval queue.

### `POST /api/treasury/approvals`
Approve a pending request. Body: `{ "requestId": "string", "approver": "string" }`

---

## Audit

### `GET /api/audit`
List all on-chain audit records (Metaplex Core NFTs).

### `GET /api/audit/[assetAddress]`
Get audit record by Metaplex Core asset address.

---

## Founders

### `GET /api/founders`
List all founder profiles (persistent in PostgreSQL).

### `GET /api/founders/[wallet]`
Get founder profile by wallet address.

---

## Agent

### `GET /api/agent`
Check if the FundFlow AI agent is registered on-chain.

### `POST /api/agent`
Register the agent in the Metaplex Agent Registry.

---

## Activity & Tour

### `GET /api/activity`
Live activity feed (last 30 events).

### `GET /api/tour`
Get guided tour audio (ElevenLabs TTS) and segment timing data.

---

## Voice

### `POST /api/voice/transcribe`
Transcribe voice pitch audio via ElevenLabs STT.

### `POST /api/voice/narrate`
Generate decision narration via ElevenLabs TTS.
