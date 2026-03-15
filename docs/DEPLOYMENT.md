# Deployment

## Production Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| Runtime | Docker (node:22-bookworm-slim) | Includes Chromium for Unbrowse |
| Platform | Coolify on VPS (72.62.82.57) | Auto-deploy on push to master |
| Database | PostgreSQL | `fundflow` database, 13 tables |
| Reverse Proxy | Traefik | Auto-SSL via Let's Encrypt |
| Domain | fundflow.ayushojha.com | A record → VPS |

## Docker Setup

The Dockerfile uses a multi-stage build:

1. **deps** (node:22-alpine): Install npm packages with native build tools
2. **builder** (node:22-alpine): Next.js build with standalone output
3. **runner** (node:22-bookworm-slim): Debian-based for Chromium + Unbrowse

The runner stage installs:
- Chromium (for Unbrowse browser automation)
- Unbrowse CLI (globally via npm)
- All required Chromium dependencies (libnss3, libatk, etc.)

### Entrypoint
The `entrypoint.sh` script:
1. Runs `unbrowse setup` (accepts terms, downloads browser engine)
2. Triggers `unbrowse health` to auto-start the HTTP server on port 6969
3. Starts Next.js via `node server.js`

## Environment Variables

### Required
```env
DATABASE_URL=postgresql://user:pass@host:5432/fundflow

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=<base58 encoded keypair>
TREASURY_WALLET_ADDRESS=<public key>
USDC_MINT_ADDRESS=<devnet USDC mint>

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=<voice id>

HUMAN_TECH_API_KEY=<passport api key>
HUMAN_TECH_SCORER_ID=<scorer id>
```

### Feature Toggles
```env
ENABLE_REAL_ANTHROPIC=true    # GPT-4o evaluation
ENABLE_REAL_HUMAN_TECH=true   # Passport verification
ENABLE_REAL_UNBROWSE=true     # Browser agent research
ENABLE_REAL_ELEVENLABS=true   # Voice narration
ENABLE_REAL_SOLANA=true       # On-chain transactions
ENABLE_REAL_METEORA=false     # Vault operations

NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_SOLANA_NETWORK=devnet
MIN_HUMANITY_SCORE=20
```

Every integration has a toggle. Set to `false` for deterministic fallback (demo works with zero API keys).

## PostgreSQL Schema

13 tables:
- `proposals` — Grant proposals with status and decision JSON
- `human_verifications` — Passport check results
- `research_results` — Unbrowse research data
- `agent_events` — SSE event history
- `audit_records` — Metaplex Core NFT decision records
- `treasury_state` — Current balance and vault state
- `treasury_transactions` — Full transaction ledger
- `fund_pools` — Fund allocation categories
- `founders` — Persistent founder profiles with platform data
- `founder_proposals` — Founder ↔ proposal relationship
- `milestones` — Tranche-based funding milestones

Write-through cache pattern: reads from in-memory store, writes to both memory and PostgreSQL asynchronously.

## Local Development

```bash
git clone https://github.com/Ayush10/fundflow-ai.git
cd fundflow-ai
npm install
cp .env.local.example .env.local
npm run dev
```

For Unbrowse locally:
```bash
npm install -g unbrowse
unbrowse setup  # accept terms
# Server auto-starts on port 6969
```
