/**
 * LI.FI Constants
 */

export const SUPPORTED_CHAINS = {
  BASE: 8453,
  ARBITRUM: 42161,
  ETHEREUM: 1,
  SEPOLIA: 11155111,
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  [SUPPORTED_CHAINS.BASE]: "Base",
  [SUPPORTED_CHAINS.ARBITRUM]: "Arbitrum",
  [SUPPORTED_CHAINS.ETHEREUM]: "Ethereum",
  [SUPPORTED_CHAINS.SEPOLIA]: "Sepolia",
};

export const DEFAULT_TOKENS: Record<number, Array<{ address: string; symbol: string; name: string }>> = {
  [SUPPORTED_CHAINS.BASE]: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum" },
    { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", name: "USD Coin" },
  ],
  [SUPPORTED_CHAINS.ARBITRUM]: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum" },
    { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", name: "USD Coin" },
  ],
  [SUPPORTED_CHAINS.ETHEREUM]: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum" },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin" },
  ],
  [SUPPORTED_CHAINS.SEPOLIA]: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum" },
    { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", symbol: "USDC", name: "USD Coin" },
  ],
};

// Destination configuration (fixed for CloakSwap)
export const DESTINATION_CONFIG = {
  // For demo: Sepolia, for production: Ethereum
  chainId: SUPPORTED_CHAINS.SEPOLIA, // Change to SUPPORTED_CHAINS.ETHEREUM for production
  token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC, change to mainnet USDC for production
  tokenSymbol: "USDC",
};

// Source chains (user can choose)
export const SOURCE_CHAINS = [
  { id: SUPPORTED_CHAINS.BASE, name: "Base", symbol: "BASE" },
  { id: SUPPORTED_CHAINS.ARBITRUM, name: "Arbitrum", symbol: "ARB" },
];
