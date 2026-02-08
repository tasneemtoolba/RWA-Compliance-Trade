/**
 * Unified Registry Service
 * Switches between demo mocks and real contracts based on DEMO_MODE
 */

import { isDemoMode } from "@/lib/demoMode";
import * as mockOnchain from "@/lib/mock/onchain";

export interface Profile {
  encryptedProfileBitMap: string;
  expiry: number;
  exists: boolean;
}

/**
 * Self-register a new profile
 */
export async function selfRegister(
  wallet: string,
  encryptedProfileBitMap: string,
  expiry: number
): Promise<string> {
  if (isDemoMode()) {
    return await mockOnchain.selfRegister(wallet, encryptedProfileBitMap, expiry);
  }
  
  // Real contract call would go here
  throw new Error("Real contract calls not implemented - use demo mode");
}

/**
 * Update existing profile
 */
export async function selfUpdateProfile(
  wallet: string,
  encryptedProfileBitMap: string,
  expiry: number
): Promise<string> {
  if (isDemoMode()) {
    return await mockOnchain.selfUpdateProfile(wallet, encryptedProfileBitMap, expiry);
  }
  
  // Real contract call would go here
  throw new Error("Real contract calls not implemented - use demo mode");
}

/**
 * Get user profile
 */
export function getProfile(wallet: string): Profile {
  if (isDemoMode()) {
    const profile = mockOnchain.getProfile(wallet);
    return {
      encryptedProfileBitMap: profile.encryptedProfileBitMap,
      expiry: profile.expiry,
      exists: profile.exists,
    };
  }
  
  // Real contract call would go here
  return { encryptedProfileBitMap: "", expiry: 0, exists: false };
}

/**
 * Get user ID by wallet
 */
export function getUserIdByWallet(wallet: string): string {
  if (isDemoMode()) {
    return mockOnchain.getUserIdByWallet(wallet);
  }
  
  // Real contract call would go here
  return "0x0";
}
