/**
 * Mock Onchain Registry
 * Simulates contract state using localStorage
 */

const STORAGE_KEY = "cloakswap_demo_state";

export interface DemoState {
  poolRules: Record<string, string>; // poolId -> ruleMask (hex)
  profiles: Record<string, { bmp: string; expiry: number }>; // walletLower -> profile
  balances: Record<string, { USDC: number; ETH: number; gGOLD: number }>; // walletLower -> balances
  hookAudit: Record<string, Array<{
    ts: number;
    poolId: string;
    allowed: boolean;
    reason: string;
    userBmp: string;
    ruleMask: string;
    txHash: string;
  }>>; // walletLower -> audit entries
}

function loadState(): DemoState {
  if (typeof window === "undefined") {
    return {
      poolRules: {},
      profiles: {},
      balances: {},
      hookAudit: {},
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load demo state:", e);
  }

  return {
    poolRules: {},
    profiles: {},
    balances: {},
    hookAudit: {},
  };
}

function saveState(state: DemoState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save demo state:", e);
  }
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Generate a fake transaction hash
 */
export async function fakeTxHash(input: string): Promise<string> {
  const timestamp = Date.now().toString();
  const combined = input + timestamp;
  
  // Use Web Crypto API if available
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      return `0x${hashHex.slice(0, 64)}`;
    } catch (e) {
      // Fallback to simple hash
    }
  }
  
  // Simple fallback hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Profile functions
export async function selfRegister(
  wallet: string,
  encryptedProfileBitMap: string,
  expiry: number
): Promise<string> {
  await delay(800);
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  
  if (state.profiles[walletLower]) {
    throw new Error("Already registered");
  }
  
  state.profiles[walletLower] = {
    bmp: encryptedProfileBitMap,
    expiry,
  };
  
  saveState(state);
  return await fakeTxHash(`register_${wallet}_${encryptedProfileBitMap}`);
}

export async function selfUpdateProfile(
  wallet: string,
  encryptedProfileBitMap: string,
  expiry: number
): Promise<string> {
  await delay(800);
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  
  if (!state.profiles[walletLower]) {
    throw new Error("Not registered");
  }
  
  state.profiles[walletLower] = {
    bmp: encryptedProfileBitMap,
    expiry,
  };
  
  saveState(state);
  return await fakeTxHash(`update_${wallet}_${encryptedProfileBitMap}`);
}

export function getProfile(wallet: string): { encryptedProfileBitMap: string; expiry: number; exists: boolean } {
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  const profile = state.profiles[walletLower];
  
  if (!profile) {
    return { encryptedProfileBitMap: "", expiry: 0, exists: false };
  }
  
  return {
    encryptedProfileBitMap: profile.bmp,
    expiry: profile.expiry,
    exists: true,
  };
}

export function getUserIdByWallet(wallet: string): string {
  // Simple hash-based userId
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) {
    const char = wallet.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

// Pool rule functions
export async function setPoolRule(poolId: string, ruleMask: string): Promise<string> {
  await delay(500);
  const state = loadState();
  state.poolRules[poolId] = ruleMask;
  saveState(state);
  return await fakeTxHash(`setPoolRule_${poolId}_${ruleMask}`);
}

export function getPoolRule(poolId: string): string {
  const state = loadState();
  return state.poolRules[poolId] || "0";
}

// Balance functions
export function creditBalance(wallet: string, tokenSymbol: string, amount: number): void {
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  
  if (!state.balances[walletLower]) {
    state.balances[walletLower] = { USDC: 0, ETH: 0, gGOLD: 0 };
  }
  
  const token = tokenSymbol.toUpperCase() as "USDC" | "ETH" | "GOLD";
  if (token === "GOLD") {
    state.balances[walletLower].gGOLD += amount;
  } else {
    state.balances[walletLower][token] += amount;
  }
  
  saveState(state);
}

export function getBalances(wallet: string): { USDC: number; ETH: number; gGOLD: number } {
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  return state.balances[walletLower] || { USDC: 0, ETH: 0, gGOLD: 0 };
}

export function debitBalance(wallet: string, tokenSymbol: string, amount: number): void {
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  
  if (!state.balances[walletLower]) {
    state.balances[walletLower] = { USDC: 0, ETH: 0, gGOLD: 0 };
  }
  
  const token = tokenSymbol.toUpperCase() as "USDC" | "ETH" | "GOLD";
  if (token === "GOLD") {
    state.balances[walletLower].gGOLD = Math.max(0, state.balances[walletLower].gGOLD - amount);
  } else {
    state.balances[walletLower][token] = Math.max(0, state.balances[walletLower][token] - amount);
  }
  
  saveState(state);
}

// Hook audit functions
export function addHookAuditEntry(
  wallet: string,
  poolId: string,
  allowed: boolean,
  reason: string,
  userBmp: string,
  ruleMask: string,
  txHash: string
): void {
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  
  if (!state.hookAudit[walletLower]) {
    state.hookAudit[walletLower] = [];
  }
  
  state.hookAudit[walletLower].unshift({
    ts: Date.now(),
    poolId,
    allowed,
    reason,
    userBmp,
    ruleMask,
    txHash,
  });
  
  // Keep only last 20 entries
  if (state.hookAudit[walletLower].length > 20) {
    state.hookAudit[walletLower] = state.hookAudit[walletLower].slice(0, 20);
  }
  
  saveState(state);
}

export function getHookAudit(wallet: string): Array<{
  ts: number;
  poolId: string;
  allowed: boolean;
  reason: string;
  userBmp: string;
  ruleMask: string;
  txHash: string;
}> {
  const state = loadState();
  const walletLower = normalizeAddress(wallet);
  return state.hookAudit[walletLower] || [];
}

// Clear all demo state (for testing)
export function clearDemoState(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
