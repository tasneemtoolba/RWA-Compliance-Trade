/**
 * Unified Pool Service
 * Switches between demo mocks and real contracts based on DEMO_MODE
 */

import { isDemoMode } from "@/lib/demoMode";
import * as mockOnchain from "@/lib/mock/onchain";

/**
 * Set pool rule mask
 */
export async function setPoolRule(poolId: string, ruleMask: string): Promise<string> {
  if (isDemoMode()) {
    return await mockOnchain.setPoolRule(poolId, ruleMask);
  }
  
  // Real contract call would go here
  throw new Error("Real contract calls not implemented - use demo mode");
}

/**
 * Get pool rule mask
 */
export function getPoolRule(poolId: string): string {
  if (isDemoMode()) {
    return mockOnchain.getPoolRule(poolId);
  }
  
  // Real contract call would go here
  return "0x0";
}
