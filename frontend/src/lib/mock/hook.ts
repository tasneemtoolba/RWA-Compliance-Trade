/**
 * Mock Hook Check
 * Simulates ComplianceHook.check() behavior
 */

import { getProfile, getPoolRule, addHookAuditEntry, fakeTxHash } from "./onchain";

export interface HookCheckResult {
  allowed: boolean;
  reason: "ELIGIBLE" | "NOT_REGISTERED" | "EXPIRED" | "NOT_ELIGIBLE" | "POOL_NOT_CONFIGURED";
  userBmp: string;
  ruleMask: string;
  txHash: string;
}

/**
 * Check user compliance against pool rules
 */
export async function checkUserCompliance(
  wallet: string,
  poolId: string
): Promise<HookCheckResult> {
  // Get pool rule
  const ruleMaskHex = getPoolRule(poolId);
  if (!ruleMaskHex || ruleMaskHex === "0") {
    const txHash = await fakeTxHash(`check_${wallet}_${poolId}_no_rule`);
    return {
      allowed: false,
      reason: "POOL_NOT_CONFIGURED",
      userBmp: "0x0",
      ruleMask: "0x0",
      txHash,
    };
  }
  
  // Get user profile
  const profile = getProfile(wallet);
  if (!profile.exists) {
    const txHash = await fakeTxHash(`check_${wallet}_${poolId}_not_registered`);
    const result = {
      allowed: false,
      reason: "NOT_REGISTERED" as const,
      userBmp: "0x0",
      ruleMask: ruleMaskHex,
      txHash,
    };
    addHookAuditEntry(wallet, poolId, false, "NOT_REGISTERED", "0x0", ruleMaskHex, txHash);
    return result;
  }
  
  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (profile.expiry < now) {
    const txHash = await fakeTxHash(`check_${wallet}_${poolId}_expired`);
    const result = {
      allowed: false,
      reason: "EXPIRED" as const,
      userBmp: profile.encryptedProfileBitMap,
      ruleMask: ruleMaskHex,
      txHash,
    };
    addHookAuditEntry(wallet, poolId, false, "EXPIRED", profile.encryptedProfileBitMap, ruleMaskHex, txHash);
    return result;
  }
  
  // Check bitmap match
  const userBitmap = BigInt(profile.encryptedProfileBitMap);
  const ruleMask = BigInt(ruleMaskHex);
  const allowed = (userBitmap & ruleMask) === ruleMask;
  
  const reason = allowed ? "ELIGIBLE" : "NOT_ELIGIBLE";
  const txHash = await fakeTxHash(`check_${wallet}_${poolId}_${reason}`);
  
  const result: HookCheckResult = {
    allowed,
    reason,
    userBmp: profile.encryptedProfileBitMap,
    ruleMask: ruleMaskHex,
    txHash,
  };
  
  addHookAuditEntry(wallet, poolId, allowed, reason, profile.encryptedProfileBitMap, ruleMaskHex, txHash);
  return result;
}

/**
 * Simulate a swap
 * First checks compliance, then updates balances if allowed
 */
export async function simulateSwap(
  wallet: string,
  poolId: string,
  fromToken: string,
  toToken: string,
  amount: number
): Promise<{ success: boolean; txHash: string; error?: string }> {
  // First check compliance
  const check = await checkUserCompliance(wallet, poolId);
  
  if (!check.allowed) {
    throw new Error(`HookBlocked: ${check.reason}`);
  }
  
  // Simulate swap delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Update balances (simple 1:1 for demo)
  const { debitBalance, creditBalance } = await import("./onchain");
  debitBalance(wallet, fromToken, amount);
  creditBalance(wallet, toToken, amount);
  
  const txHash = await fakeTxHash(`swap_${wallet}_${poolId}_${fromToken}_${toToken}_${amount}`);
  
  return {
    success: true,
    txHash,
  };
}
