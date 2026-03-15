# Multi-Agent System

## Agent Council

FundFlow AI uses 5 specialized AI agents that collaborate on every grant decision. Each agent has a distinct role, personality, and ElevenLabs voice.

| Agent | Role | Specialty | Voice | Platforms |
|-------|------|-----------|-------|-----------|
| Scout | Social Intelligence | X/Twitter + GitHub | Rachel | 2 |
| Digger | Community Researcher | Reddit + HackerNews | Antoni | 2 |
| Verifier | Credential Checker | Google + Y Combinator | Arnold | 2 |
| Analyst | Data Synthesizer | Cross-reference + Partners | Adam | — |
| Judge | Final Arbiter | Verdict + Funding | Custom | — |

## How Agents Coordinate

### Phase 1: Introduction
The Analyst announces the incoming proposal. Scout, Digger, and Verifier declare their research targets.

### Phase 2: Parallel Research
All 6 platform queries run concurrently via Unbrowse. Each agent's platform calls are independent and non-blocking.

### Phase 3: Discovery Reports
As results return, each agent "speaks" their findings:
- Scout reports Twitter followers, GitHub stars, bio
- Digger reports Reddit mentions, HN points
- Verifier reports Google results, YC batch

Key discoveries are narrated via ElevenLabs TTS with the agent's assigned voice.

### Phase 4: Cross-Verification
The Analyst cross-references all findings:
- Checks partner database (10 known-good organizations)
- Checks founder history (prior proposals and their outcomes)
- Calculates composite reputation score

### Phase 5: GPT-4o Debate
GPT-4o generates a natural 4-6 line debate script between the agents, incorporating the actual research data. Agents challenge, verify, and agree on findings.

### Phase 6: Verdict
The Judge tallies votes, announces the verdict, and narrates it via ElevenLabs. The verdict includes:
- Vote count (N-of-4)
- Reputation score
- Platforms verified
- Partner affiliations
- Prior history

## Reputation Scoring

The reputation score is a weighted composite:

```
Overall = Platform Presence (20%)
        + Sentiment (15%)
        + Verification Confidence (25%)
        + Community Engagement (15%)
        + Track Record (25%)
```

### Modifiers
- **Partner boost**: Up to +30 for affiliations with known organizations
- **History bonus**: +8 per previously approved proposal
- **History penalty**: -12 per previously rejected proposal

### Partner Database
10 pre-configured organizations with trust scores:

| Organization | Type | Trust Score |
|---|---|---|
| Y Combinator | Accelerator | 95 |
| a16z Crypto | Venture | 92 |
| Solana Foundation | Foundation | 90 |
| Ethereum Foundation | Foundation | 88 |
| Optimism RetroPGF | Foundation | 85 |
| Uniswap Foundation | Foundation | 82 |
| Protocol Labs | Protocol | 80 |
| Aave Grants DAO | DAO | 78 |
| Gitcoin | DAO | 75 |
| Superteam | DAO | 70 |

## Risk Assessment

4-dimension risk scoring with flags:

| Dimension | Weight | Factors |
|---|---|---|
| Budget Risk | 30% | Request size, milestone mentions |
| Team Risk | 35% | Reputation score, humanity score, GitHub presence |
| Timeline Risk | 15% | Roadmap mentions, urgency language |
| Market Risk | 20% | Novelty claims, proven traction |

Risk flags are surfaced in the evaluation rationale and factor into the AI's scoring prompt.

## SSE Event Types

The multi-agent system emits these SSE events during evaluation:

| Event Step | Status Values | Data |
|---|---|---|
| `human-check` | running, passed, failed | HumanVerification |
| `multi-agent-research` | running, complete | — |
| `agent-message` | message | AgentMessage (id, name, emoji, text, type, audioUrl) |
| `reputation-score` | complete | ReputationScore (6 dimensions) |
| `unbrowse-research` | running, complete | UnbrowseResearch |
| `ai-evaluation` | running, complete | EvaluationScore (5 criteria) |
| `decision` | running, complete | AgentDecision |
| `on-chain` | minting, transferring, rebalancing, complete | txHash |
