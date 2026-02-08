import { sepolia, mainnet, base, arbitrum } from "viem/chains";

export type Mode = "demo" | "production";

export const MODE_CONFIG = {
  demo: {
    chain: sepolia,
    name: "Demo (Sepolia)",
    description: "Privacy + hook gating demo",
    lifiEnabled: false,
  },
  production: {
    chain: mainnet,
    name: "Production (Mainnet)",
    description: "LI.FI funding flows",
    lifiEnabled: true,
  },
} as const;

export const SUPPORTED_CHAINS = {
  ethereum: mainnet,
  base: base,
  arbitrum: arbitrum,
} as const;
