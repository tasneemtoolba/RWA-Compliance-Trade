/**
 * Unified Audit Service
 * Switches between demo mocks and real contracts based on DEMO_MODE
 */

import { isDemoMode } from "@/lib/demoMode";
import * as mockOnchain from "@/lib/mock/onchain";

export interface AuditEntry {
  ts: number;
  poolId: string;
  allowed: boolean;
  reason: string;
  userBmp: string;
  ruleMask: string;
  txHash: string;
}

/**
 * Get hook audit history
 */
export function getHookAudit(wallet: string): AuditEntry[] {
  if (isDemoMode()) {
    return mockOnchain.getHookAudit(wallet);
  }
  
  // Real contract event query would go here
  return [];
}
