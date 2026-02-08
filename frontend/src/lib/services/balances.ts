/**
 * Unified Balance Service
 * Switches between demo mocks and real contracts based on DEMO_MODE
 */

import { isDemoMode } from "@/lib/demoMode";
import * as mockOnchain from "@/lib/mock/onchain";

/**
 * Get balances for a wallet
 */
export function getBalances(wallet: string): { USDC: number; ETH: number; gGOLD: number } {
  if (isDemoMode()) {
    return mockOnchain.getBalances(wallet);
  }
  
  // Real contract call would go here
  return { USDC: 0, ETH: 0, gGOLD: 0 };
}

/**
 * Credit balance (for demo/testing)
 */
export function creditBalance(wallet: string, tokenSymbol: string, amount: number): void {
  if (isDemoMode()) {
    mockOnchain.creditBalance(wallet, tokenSymbol, amount);
  }
}

/**
 * Debit balance (for demo/testing)
 */
export function debitBalance(wallet: string, tokenSymbol: string, amount: number): void {
  if (isDemoMode()) {
    mockOnchain.debitBalance(wallet, tokenSymbol, amount);
  }
}
