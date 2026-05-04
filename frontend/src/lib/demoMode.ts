/**
 * Demo Mode Configuration
 * When enabled, uses localStorage-based mocks instead of real contracts
 */

const MODE_STORAGE_KEY = "cloakswap-mode";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function withDemo<T extends (...args: any[]) => any>(
  realFn: T,
  demoFn: T
): T {
  return (isDemoMode() ? demoFn : realFn) as T;
}

export function isDemoMode(): boolean {
  // Check localStorage first (UI mode selector)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "demo") {
      return true;
    }
    if (stored === "production") {
      return false;
    }
  }
  
  // Fallback to environment variable
  return DEMO_MODE;
}
