/**
 * Demo Mode Configuration
 * When enabled, uses localStorage-based mocks instead of real contracts
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function withDemo<T extends (...args: any[]) => any>(
  realFn: T,
  demoFn: T
): T {
  return (DEMO_MODE ? demoFn : realFn) as T;
}

export function isDemoMode(): boolean {
  return DEMO_MODE;
}
