/**
 * ENS Text Record Keys for CloakSwap
 * Using com.cloakswap.* prefix to avoid collisions
 */
export const ENS_KEYS = {
  // Credential reference (pointer to onchain encrypted profile)
  CREDENTIAL_REF: "com.cloakswap.credentialRef",
  
  // Trading preferences
  DEFAULT_ASSET: "com.cloakswap.defaultAsset",
  SLIPPAGE: "com.cloakswap.slippage",
  PREFERRED_CHAIN: "com.cloakswap.preferredChain",
  PREFERRED_TOKEN: "com.cloakswap.preferredToken",
  
  // Display preferences
  DISPLAY_NAME: "com.cloakswap.displayName",
} as const;

export type EnsKey = typeof ENS_KEYS[keyof typeof ENS_KEYS];
