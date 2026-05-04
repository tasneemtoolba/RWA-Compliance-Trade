/**
 * LI.FI Constants
 */

export const SUPPORTED_CHAINS = {
  BASE: 8453,
  ARBITRUM: 42161,
  ETHEREUM: 1,
  SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
  ARBITRUM_SEPOLIA: 421614,
  OPTIMISM_SEPOLIA: 11155420,
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  [SUPPORTED_CHAINS.BASE]: "Base",
  [SUPPORTED_CHAINS.ARBITRUM]: "Arbitrum",
  [SUPPORTED_CHAINS.ETHEREUM]: "Ethereum",
  [SUPPORTED_CHAINS.SEPOLIA]: "Sepolia",
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: "Base Sepolia",
  [SUPPORTED_CHAINS.ARBITRUM_SEPOLIA]: "Arbitrum Sepolia",
  [SUPPORTED_CHAINS.OPTIMISM_SEPOLIA]: "Optimism Sepolia",
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
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum" },
    { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", name: "USD Coin" },
  ],
  [SUPPORTED_CHAINS.ARBITRUM_SEPOLIA]: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum" },
    { address: "0x75faf114eafb1BDbe2F0316DF893fd58Ce87AAf1", symbol: "USDC", name: "USD Coin" },
  ],
  [SUPPORTED_CHAINS.OPTIMISM_SEPOLIA]: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum" },
    { address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", symbol: "USDC", name: "USD Coin" },
  ],
};

// Destination configuration (fixed for CloakSwap)
// This will be overridden based on mode (demo = Sepolia, production = Ethereum)
export const DESTINATION_CONFIG = {
  // For demo: Sepolia, for production: Ethereum
  chainId: SUPPORTED_CHAINS.SEPOLIA, // Change to SUPPORTED_CHAINS.ETHEREUM for production
  token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC, change to mainnet USDC for production
  tokenSymbol: "USDC",
};

// Mainnet source chains
export const SOURCE_CHAINS_MAINNET = [
  { id: SUPPORTED_CHAINS.BASE, name: "Base", symbol: "BASE" },
  { id: SUPPORTED_CHAINS.ARBITRUM, name: "Arbitrum", symbol: "ARB" },
  { id: SUPPORTED_CHAINS.ETHEREUM, name: "Ethereum", symbol: "ETH" },
];

// Sepolia testnet source chains (for demo mode)
export const SOURCE_CHAINS_SEPOLIA = [
  { id: SUPPORTED_CHAINS.SEPOLIA, name: "Sepolia", symbol: "SEP" },
  { id: SUPPORTED_CHAINS.BASE_SEPOLIA, name: "Base Sepolia", symbol: "BASE-SEP" },
  { id: SUPPORTED_CHAINS.ARBITRUM_SEPOLIA, name: "Arbitrum Sepolia", symbol: "ARB-SEP" },
  { id: SUPPORTED_CHAINS.OPTIMISM_SEPOLIA, name: "Optimism Sepolia", symbol: "OP-SEP" },
];

// Default to mainnet chains (will be overridden by mode)
export const SOURCE_CHAINS = SOURCE_CHAINS_MAINNET;

// Testnet chain IDs that LI.FI doesn't support
export const TESTNET_CHAIN_IDS = new Set([
  SUPPORTED_CHAINS.SEPOLIA,
  SUPPORTED_CHAINS.BASE_SEPOLIA,
  SUPPORTED_CHAINS.ARBITRUM_SEPOLIA,
  SUPPORTED_CHAINS.OPTIMISM_SEPOLIA,
]);

/**
 * Check if a chain ID is a testnet
 */
export function isTestnetChain(chainId: number): boolean {
  return TESTNET_CHAIN_IDS.has(chainId);
}
