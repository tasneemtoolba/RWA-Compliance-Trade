/**
 * LI.FI SDK Configuration
 * LI.FI no longer supports testnets - always use mainnet API
 */

// LI.FI mainnet API (testnets are not supported)
const LIFI_MAINNET_API = "https://li.quest/v1";

let lifiConfig: any = null;

/**
 * Initialize LI.FI SDK with proper configuration
 * Always uses mainnet API since LI.FI doesn't support testnets
 */
export async function getLifiConfig() {
  if (lifiConfig) return lifiConfig;

  try {
    const lifiModule = await import("@lifi/sdk");

    // Always use mainnet API - LI.FI no longer supports testnets
    const apiUrl = LIFI_MAINNET_API;

    // Check if createConfig exists (LI.FI SDK v3)
    if (lifiModule.createConfig) {
      lifiConfig = lifiModule.createConfig({
        integrator: "TruMarket",
        apiUrl,
        // EVM provider will be set per request via getWalletClient
      });
    } else {
      // Fallback: SDK might be initialized differently
      lifiConfig = {
        apiUrl,
        ...lifiModule,
      };
    }

    return lifiConfig;
  } catch (error) {
    console.warn("Failed to initialize LI.FI config:", error);
    return null;
  }
}

/**
 * Get the API URL - always returns mainnet API
 */
export function getLifiApiUrl(): string {
  return LIFI_MAINNET_API;
}
