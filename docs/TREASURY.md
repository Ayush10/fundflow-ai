# Treasury & Banking Infrastructure

## Overview

FundFlow AI includes a banking-grade treasury management system that goes beyond simple wallet balances. It features a full transaction ledger, fund allocation pools, milestone-based funding, multi-sig approvals, and real-time alerts.

## Treasury State

| Field | Description |
|-------|-------------|
| `usdcBalance` | Liquid USDC available for immediate disbursement |
| `meteoraVaultBalance` | USDC deposited in Meteora yield vault |
| `meteoraYieldEarned` | Total yield earned from vault deposits |
| `totalDisbursed` | Cumulative USDC sent to founders |
| `walletAddress` | Treasury Solana wallet address |

## Fund Allocation Pools

Capital is allocated across 4 pools. Each pool has a budget cap and tracks disbursements.

| Pool | Icon | Description | Max Allocation |
|------|------|-------------|----------------|
| DeFi & Infrastructure | Links | Core DeFi tooling, indexers, analytics | $150,000 |
| Public Goods | Seedling | Open source, commons, climate, public benefit | $100,000 |
| Research & Education | Microscope | Academic research, ZK proofs, documentation | $50,000 |
| Community & DAOs | People | Meetups, governance tools, developer onboarding | $40,000 |

Proposals are **auto-categorized** into pools using keyword analysis. Pool depletion triggers treasury alerts.

## Milestone-Based Funding

Approved grants are split into 3 tranches:

| Tranche | Percentage | Trigger |
|---------|-----------|---------|
| Phase 1: Setup & Foundation | 30% | Auto-disbursed on approval |
| Phase 2: Core Development | 30% | Requires milestone verification |
| Phase 3: Launch & Delivery | 40% | Requires milestone verification |

Only Tranche 1 is disbursed immediately. Tranches 2 and 3 require the founder to submit proof of milestone completion, which the agent council can then verify.

## Multi-Sig Approvals

Disbursements exceeding **$15,000** require multi-sig approval:
- 2-of-N approvals required
- Requests queued in the approval queue
- Status: pending → approved | rejected
- API: `GET/POST /api/treasury/approvals`

## Treasury Alerts

The system monitors treasury health and generates alerts:

| Level | Condition | Example |
|-------|-----------|---------|
| Critical | Liquid balance < $9,000 | "USDC balance below minimum buffer" |
| Warning | Liquid balance < $15,000 | "Approaching minimum buffer" |
| Warning | Pool > 85% depleted | "DeFi pool nearly depleted" |
| Info | Yield > $1,000 | "Consider harvesting yield to liquid" |

## Transaction Ledger

Every treasury movement is logged with:

| Field | Description |
|-------|-------------|
| `type` | incoming, deposit, withdrawal, disbursement, yield, rebalance, fee |
| `amount` | USDC amount |
| `description` | Human-readable description |
| `counterparty` | Recipient wallet (for disbursements) |
| `proposalId` | Linked proposal (for disbursements) |
| `pool` | Which fund pool (for disbursements) |
| `txHash` | Solana transaction hash (if on-chain) |
| `timestamp` | ISO 8601 timestamp |

## Vault Management (Meteora)

Automatic yield optimization:

- **Target allocation**: 62% liquid / 38% vault
- **Minimum liquid buffer**: $9,000 USDC
- **Rebalance trigger**: After every disbursement
- **Yield rate**: ~4.5% APY (tracked daily)
- **Withdraw-on-demand**: If disbursement exceeds liquid, vault funds are withdrawn first
