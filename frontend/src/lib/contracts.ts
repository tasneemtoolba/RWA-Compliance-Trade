// Contract addresses - replace with your Sepolia deployments

export const CONTRACTS = {
  sepolia: {
    userRegistry: "0xYourUserRegistry",
    complianceHook: "0xYourComplianceHook",
    fheVerifier: "0xYourFHEVerifier",
    // For MVP we use a constant poolId
    poolId: "0x" + "11".repeat(32), // bytes32
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
