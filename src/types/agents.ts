// ============ AGENT PERSONAS ============

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  specialty: string;
  emoji: string;
  color: string;
  voiceId?: string;
}

// ============ PLATFORM RESEARCH ============

export interface PlatformResult {
  platform: string;
  agentId: string;
  found: boolean;
  data: Record<string, unknown>;
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "not_found";
  confidence: number;
  url?: string;
  source: "unbrowse" | "fallback";
}

// ============ MULTI-AGENT CONVERSATION ============

export interface AgentMessage {
  agentId: string;
  agentName: string;
  emoji: string;
  text: string;
  timestamp: string;
  audioUrl?: string;
  type: "discovery" | "verification" | "challenge" | "agreement" | "verdict";
}

export interface AgentConversation {
  proposalId: string;
  messages: AgentMessage[];
  startedAt: string;
  completedAt?: string;
}

// ============ REPUTATION SCORE ============

export interface ReputationScore {
  overall: number;
  platformPresence: number;
  sentimentScore: number;
  verificationScore: number;
  communityEngagement: number;
  trackRecord: number;
  breakdown: PlatformResult[];
  founderName?: string;
}

// ============ FOUNDER PROFILE ============

export interface FounderProfile {
  wallet: string;
  name?: string;
  bio?: string;
  platforms: {
    github?: { username: string; url: string; repos: number; stars: number };
    twitter?: { handle: string; url: string; followers: number };
    linkedin?: { headline: string; url: string };
    reddit?: { username: string; karma: number; url: string };
    ycombinator?: { found: boolean; company?: string; batch?: string; url?: string };
    hackernews?: { username: string; karma: number; url: string };
    google?: { articlesFound: number; sentiment: string };
  };
  reputationScore: number;
  proposals: FounderProposalEntry[];
  firstSeen: string;
  lastSeen: string;
  totalFunded: number;
  totalRequested: number;
}

export interface FounderProposalEntry {
  id: string;
  title: string;
  amount: number;
  decision: string;
  score: number;
  date: string;
}
