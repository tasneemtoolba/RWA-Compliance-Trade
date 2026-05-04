// Contract addresses - update with your deployed addresses

export const CONTRACTS = {
  sepolia: {
    userRegistry: "0xYourUserRegistry",
    complianceHook: "0xYourComplianceHook",
    fheVerifier: "0xYourFHEVerifier",
    // Pool ID - update with your actual pool ID or use demo pool ID from deploy script
    poolId: "0x" + "11".repeat(32), // bytes32
  },
  mainnet: {
    userRegistry: "0xYourUserRegistry",
    complianceHook: "0xYourComplianceHook",
    fheVerifier: "0xYourFHEVerifier",
    poolId: "0xYourPoolId", // Update with your actual Uniswap v4 pool ID
  },
};

export type ReasonCode = 0 | 1 | 2 | 3 | 4;

export const reasonText: Record<number, string> = {
  0: "OK",
  1: "No credential found. Go to Get Verified.",
  2: "Credential expired. Re-verify to trade.",
  3: "Not eligible for this market.",
  4: "Pool not configured.",
};
