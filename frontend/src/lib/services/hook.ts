/**
 * Unified Hook Service
 * Switches between demo mocks and real contracts based on DEMO_MODE
 */

import { isDemoMode } from "@/lib/demoMode";
import * as mockHook from "@/lib/mock/hook";

export interface HookCheckResult {
  allowed: boolean;
  reason: "ELIGIBLE" | "NOT_REGISTERED" | "EXPIRED" | "NOT_ELIGIBLE" | "POOL_NOT_CONFIGURED";
  userBmp: string;
  ruleMask: string;
  txHash: string;
}

/**
 * Check user compliance
 */
export async function checkUserCompliance(
  wallet: string,
  poolId: string
): Promise<HookCheckResult> {
  if (isDemoMode()) {
    return await mockHook.checkUserCompliance(wallet, poolId);
  }
  
  // Real contract call would go here
  throw new Error("Real contract calls not implemented - use demo mode");
}

/**
 * Simulate swap
 */
export async function simulateSwap(
  wallet: string,
  poolId: string,
  fromToken: string,
  toToken: string,
  amount: number
): Promise<{ success: boolean; txHash: string; error?: string }> {
  if (isDemoMode()) {
    return await mockHook.simulateSwap(wallet, poolId, fromToken, toToken, amount);
  }
  
  // Real contract call would go here
  throw new Error("Real contract calls not implemented - use demo mode");
}
