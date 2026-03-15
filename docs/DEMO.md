# Demo Guide

## Auto-Demo (Recommended for Video Recording)

The auto-demo page runs the entire system automatically — one click, no manual interaction needed.

### URL
```
https://fundflow.ayushojha.com/demo
```

### What It Does
1. **Title screen** — "Start Live Demo" button
2. **Guided tour** — ElevenLabs narrates the dashboard with subtitles (~70s)
3. **Dashboard flash** — Shows treasury stats, proposal counts
4. **Auto-fill form** — Types the proposal character by character with cursor animation
5. **Auto-submit** — Creates the proposal and triggers evaluation
6. **Agent pipeline** — Full multi-agent evaluation streams in real-time:
   - Human Passport check
   - 5 agents debating (streamed messages with ElevenLabs narration)
   - Reputation score display
   - AI scores animate as progress bars
   - Decision rendered + ElevenLabs verdict narration plays
   - On-chain transaction link
7. **Founder profiles** — Shows the new founder created in PostgreSQL
8. **Treasury ledger** — Shows the disbursement transaction
9. **End screen** — Sponsor badges and URLs

### Recording Setup
1. Open the demo URL in your browser
2. Set browser to 1920x1080 or similar
3. Start OBS Studio (or any screen recorder)
4. Click "Start Live Demo"
5. Wait for it to complete (~3 minutes)
6. Stop recording

### Notes
- The ElevenLabs tour audio is generated on first load and cached server-side
- Agent narrations play automatically during evaluation
- No sound on your end is needed — the AI provides all audio
- Each run creates a new proposal, so the demo is repeatable

## Manual Demo

If you prefer to manually walk through the system:

1. **Dashboard** (`/`) — Scroll through stats, charts, activity feed, sponsor showcase
2. **Submit proposal** (`/proposals/new`) — Fill in title, description, amount, wallet
3. **Evaluate** (`/proposals/[id]`) — Click "Trigger AI Evaluation" and watch
4. **Download report** — Click "PDF Report" on the proposal detail page
5. **Founders** (`/founders`) — See the new founder profile
6. **Treasury** (`/treasury`) — See the transaction in the ledger
7. **Audit** (`/audit`) — See the on-chain Metaplex NFT record
