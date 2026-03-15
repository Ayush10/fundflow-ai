export interface TourSegment {
  id: string;
  label: string;
  subtitle: string;
  scrollAt: number;
  audioAt: number;
  endAt: number;
  sponsorName: string;
  sponsorColor: string;
}

export const TOUR_SCRIPT = [
  "Welcome to FundFlow AI, an autonomous grant allocator running live on Solana.",
  "Every decision here is made by AI agents, verified on-chain, and backed by real USDC.",
  "... ",
  "These are live treasury metrics.",
  "The yield you see comes from Meteora dynamic vaults, where idle funds earn around four and a half percent APY automatically.",
  "... ",
  "Here we track disbursements over time and proposal outcomes.",
  "Every proposal is scored by GPT-4o across five weighted criteria before any funds move.",
  "... ",
  "Fund pools allocate capital across DeFi, public goods, research, and community categories.",
  "Treasury alerts flag anomalies like low liquidity or pool depletion.",
  "... ",
  "The live activity feed shows every action in real time.",
  "Proposals submitted, evaluations completed, funds disbursed. Agent narrations are powered by ElevenLabs.",
  "... ",
  "On-chain status confirms our Solana devnet integration.",
  "The agent identity is a Metaplex Core NFT, and every decision is minted as an immutable audit record.",
  "... ",
  "Recent proposals show the pipeline.",
  "Each applicant is verified through human dot tech for Sybil resistance, and Unbrowse researches their GitHub, Twitter, and web presence across six platforms.",
  "... ",
  "Finally, these are the six live integrations powering everything you just saw.",
  "Unbrowse, ElevenLabs, Solana, Metaplex, Meteora, human dot tech, and GPT-4o.",
  "Each one is deeply woven into the autonomous pipeline.",
].join(" ");

/**
 * Timing manifest — scrollAt is ~1.5s before audioAt so the section
 * is visible before the narrator mentions it.
 * These are estimates for ~200 words at ElevenLabs pace (~155 wpm).
 * Refine after generating the actual audio.
 */
export const TOUR_SEGMENTS: TourSegment[] = [
  {
    id: "tour-hero",
    label: "Welcome",
    subtitle: "Welcome to FundFlow AI — an autonomous grant allocator running live on Solana, backed by real USDC.",
    scrollAt: 0,
    audioAt: 0,
    endAt: 9,
    sponsorName: "FundFlow AI",
    sponsorColor: "text-violet-400",
  },
  {
    id: "tour-stats",
    label: "Treasury",
    subtitle: "Live treasury metrics — yield from Meteora dynamic vaults earning ~4.5% APY automatically.",
    scrollAt: 7.5,
    audioAt: 9,
    endAt: 17,
    sponsorName: "Meteora",
    sponsorColor: "text-amber-400",
  },
  {
    id: "tour-funding",
    label: "Analytics",
    subtitle: "Disbursements over time and proposal outcomes — scored by GPT-4o across five weighted criteria.",
    scrollAt: 15.5,
    audioAt: 17,
    endAt: 25,
    sponsorName: "GPT-4o",
    sponsorColor: "text-purple-400",
  },
  {
    id: "tour-pools",
    label: "Fund Pools",
    subtitle: "Capital allocated across DeFi, public goods, research, and community. Alerts flag anomalies.",
    scrollAt: 23.5,
    audioAt: 25,
    endAt: 33,
    sponsorName: "Meteora",
    sponsorColor: "text-amber-400",
  },
  {
    id: "tour-activity",
    label: "Activity",
    subtitle: "Live feed of every action — proposals, evaluations, disbursements. Narrations by ElevenLabs.",
    scrollAt: 31.5,
    audioAt: 33,
    endAt: 42,
    sponsorName: "ElevenLabs",
    sponsorColor: "text-violet-400",
  },
  {
    id: "tour-onchain",
    label: "On-Chain",
    subtitle: "Solana devnet — agent identity as Metaplex Core NFT, every decision minted immutably on-chain.",
    scrollAt: 40.5,
    audioAt: 42,
    endAt: 51,
    sponsorName: "Solana + Metaplex",
    sponsorColor: "text-emerald-400",
  },
  {
    id: "tour-proposals",
    label: "Proposals",
    subtitle: "Applicants verified via human.tech for Sybil resistance — Unbrowse researches 6 platforms.",
    scrollAt: 49.5,
    audioAt: 51,
    endAt: 61,
    sponsorName: "Unbrowse + human.tech",
    sponsorColor: "text-cyan-400",
  },
  {
    id: "tour-sponsors",
    label: "Integrations",
    subtitle: "Six live sponsor integrations — deeply woven into the autonomous pipeline.",
    scrollAt: 59.5,
    audioAt: 61,
    endAt: 72,
    sponsorName: "All Sponsors",
    sponsorColor: "text-white",
  },
];

export const TOUR_TOTAL_DURATION = 72;
