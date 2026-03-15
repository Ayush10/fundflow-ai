import { createHash } from "crypto";

import bs58 from "bs58";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { getAppConfig } from "@/lib/config";

function deriveKeypair(label: string): Keypair {
  const seed = createHash("sha256").update(label).digest().subarray(0, 32);
  return Keypair.fromSeed(seed);
}

function parseSecretKey(secret: string): Uint8Array {
  const trimmed = secret.trim();

  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed) as number[]);
  }

  return bs58.decode(trimmed);
}

function parsePublicKey(
  value: string | undefined,
  fallbackLabel: string
): PublicKey {
  if (!value) {
    return deriveKeypair(fallbackLabel).publicKey;
  }

  try {
    return new PublicKey(value);
  } catch {
    return deriveKeypair(fallbackLabel).publicKey;
  }
}

export function getSolanaConnection(): Connection {
  return new Connection(getAppConfig().solanaRpcUrl, "confirmed");
}

export function getTreasuryAuthority(): Keypair {
  const config = getAppConfig();

  if (!config.solanaPrivateKey) {
    return deriveKeypair("fundflow-demo-treasury-authority");
  }

  try {
    return Keypair.fromSecretKey(parseSecretKey(config.solanaPrivateKey));
  } catch {
    return deriveKeypair("fundflow-demo-treasury-authority");
  }
}

export function getTreasuryWalletPublicKey(): PublicKey {
  const config = getAppConfig();

  if (config.treasuryWalletAddress) {
    return parsePublicKey(
      config.treasuryWalletAddress,
      "fundflow-demo-treasury-wallet"
    );
  }

  return getTreasuryAuthority().publicKey;
}

export function getUsdcMintPublicKey(): PublicKey {
  return parsePublicKey(getAppConfig().usdcMintAddress, "fundflow-demo-usdc-mint");
}

export function getMeteoraVaultPublicKey(): PublicKey {
  return parsePublicKey(
    getAppConfig().meteoraVaultAddress,
    "fundflow-demo-meteora-vault"
  );
}

export async function getTreasurySolBalance(): Promise<number> {
  try {
    const lamports = await getSolanaConnection().getBalance(
      getTreasuryWalletPublicKey()
    );
    return lamports / 1_000_000_000;
  } catch {
    return 0;
  }
}

export function getSolanaFoundation() {
  const config = getAppConfig();

  return {
    mode: config.liveSolana ? "configured" : "simulated",
    rpcUrl: config.solanaRpcUrl,
    treasuryWalletAddress: getTreasuryWalletPublicKey().toBase58(),
    usdcMintAddress: getUsdcMintPublicKey().toBase58(),
    meteoraVaultAddress: getMeteoraVaultPublicKey().toBase58(),
  };
}
