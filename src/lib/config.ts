export interface AppConfig {
  anthropicApiKey?: string;
  anthropicModel: string;
  openaiApiKey?: string;
  openaiModel: string;
  humanTechApiKey?: string;
  humanTechApiUrl?: string;
  unbrowseApiKey?: string;
  unbrowseApiUrl?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  meteoraVaultAddress?: string;
  minHumanityScore: number;
  solanaNetwork: string;
  solanaPrivateKey?: string;
  solanaRpcUrl: string;
  treasuryWalletAddress?: string;
  usdcMintAddress?: string;
  liveAnthropic: boolean;
  liveHumanTech: boolean;
  liveUnbrowse: boolean;
  liveElevenLabs: boolean;
  liveSolana: boolean;
  liveMeteora: boolean;
}

function toBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getAppConfig(): AppConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const humanTechApiKey = process.env.HUMAN_TECH_API_KEY;
  const unbrowseApiKey = process.env.UNBROWSE_API_KEY;
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

  return {
    anthropicApiKey,
    anthropicModel:
      process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    openaiApiKey,
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
    humanTechApiKey,
    humanTechApiUrl: process.env.HUMAN_TECH_API_URL,
    unbrowseApiKey,
    unbrowseApiUrl: process.env.UNBROWSE_API_URL,
    elevenLabsApiKey,
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
    meteoraVaultAddress: process.env.METEORA_VAULT_ADDRESS,
    minHumanityScore: toNumber(process.env.MIN_HUMANITY_SCORE, 65),
    solanaNetwork: process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet",
    solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
    solanaRpcUrl:
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    treasuryWalletAddress: process.env.TREASURY_WALLET_ADDRESS,
    usdcMintAddress: process.env.USDC_MINT_ADDRESS,
    liveAnthropic:
      toBoolean(process.env.ENABLE_REAL_ANTHROPIC) &&
      (Boolean(anthropicApiKey) || Boolean(openaiApiKey)),
    liveHumanTech:
      toBoolean(process.env.ENABLE_REAL_HUMAN_TECH) && Boolean(humanTechApiKey),
    liveUnbrowse:
      toBoolean(process.env.ENABLE_REAL_UNBROWSE) && Boolean(unbrowseApiKey),
    liveElevenLabs:
      toBoolean(process.env.ENABLE_REAL_ELEVENLABS) &&
      Boolean(elevenLabsApiKey),
    liveSolana:
      toBoolean(process.env.ENABLE_REAL_SOLANA) &&
      Boolean(process.env.SOLANA_PRIVATE_KEY),
    liveMeteora:
      toBoolean(process.env.ENABLE_REAL_METEORA) &&
      Boolean(process.env.METEORA_VAULT_ADDRESS),
  };
}
