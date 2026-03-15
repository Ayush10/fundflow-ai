import type { AgentPersona } from "@/types/agents";

/**
 * Five specialized AI agents that collaborate on due diligence.
 * Each has a distinct role, personality, and ElevenLabs voice.
 */

export const AGENT_SCOUT: AgentPersona = {
  id: "scout",
  name: "Scout",
  role: "Social Intelligence",
  specialty: "X/Twitter and social media analysis",
  emoji: "🔍",
  color: "text-blue-400",
  voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
};

export const AGENT_DIGGER: AgentPersona = {
  id: "digger",
  name: "Digger",
  role: "Community Researcher",
  specialty: "Reddit and HackerNews deep dives",
  emoji: "⛏️",
  color: "text-orange-400",
  voiceId: "ErXwobaYiN019PkySvjV", // Antoni
};

export const AGENT_VERIFIER: AgentPersona = {
  id: "verifier",
  name: "Verifier",
  role: "Credential Checker",
  specialty: "Google search, Y Combinator, and news verification",
  emoji: "✅",
  color: "text-green-400",
  voiceId: "VR6AewLTigWG4xSOukaG", // Arnold
};

export const AGENT_ANALYST: AgentPersona = {
  id: "analyst",
  name: "Analyst",
  role: "Data Synthesizer",
  specialty: "Cross-referencing findings and scoring reputation",
  emoji: "📊",
  color: "text-purple-400",
  voiceId: "pNInz6obpgDQGcFmaJgB", // Adam
};

export const AGENT_JUDGE: AgentPersona = {
  id: "judge",
  name: "Judge",
  role: "Final Arbiter",
  specialty: "Verdict rendering and funding decisions",
  emoji: "⚖️",
  color: "text-amber-400",
};

export const ALL_AGENTS: AgentPersona[] = [
  AGENT_SCOUT,
  AGENT_DIGGER,
  AGENT_VERIFIER,
  AGENT_ANALYST,
  AGENT_JUDGE,
];

export function getAgent(id: string): AgentPersona {
  return ALL_AGENTS.find((a) => a.id === id) ?? AGENT_ANALYST;
}
