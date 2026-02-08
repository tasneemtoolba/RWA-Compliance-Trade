import { createPublicClient, http } from "viem";
import { sepolia, mainnet } from "viem/chains";
import { CONTRACTS } from "./contracts";
import hookAbi from "./abi/ComplianceHook.json";
import { Mode } from "./ens";

/**
 * Check user eligibility via hook
 */
export async function checkEligibility(
  user: string,
  poolId: string,
  mode: Mode = "demo"
): Promise<{ eligible: boolean; reasonCode: number }> {
  const chain = mode === "demo" ? sepolia : mainnet;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const cfg = CONTRACTS.sepolia; // In production, use mode-based config

  const result = await client.readContract({
    address: cfg.complianceHook as `0x${string}`,
    abi: hookAbi,
    functionName: "check",
    args: [user as `0x${string}`, poolId as `0x${string}`],
  });

  const [eligible, reasonCode] = result as [boolean, number];
  return { eligible, reasonCode };
}

/**
 * Read ComplianceCheck events from hook
 */
export async function readComplianceCheckEvents(
  user: string,
  poolId: string,
  fromBlock: bigint = 0n,
  mode: Mode = "demo"
): Promise<any[]> {
  const chain = mode === "demo" ? sepolia : mainnet;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const cfg = CONTRACTS.sepolia;

  try {
    const events = await client.getLogs({
      address: cfg.complianceHook as `0x${string}`,
      event: {
        type: "event",
        name: "ComplianceCheck",
        inputs: [
          { name: "user", type: "address", indexed: true },
          { name: "poolId", type: "bytes32", indexed: true },
          { name: "eligible", type: "bool", indexed: false },
          { name: "reasonCode", type: "uint8", indexed: false },
        ],
      },
      args: {
        user: user as `0x${string}`,
        poolId: poolId as `0x${string}`,
      },
      fromBlock,
    });

    return events;
  } catch (error) {
    console.error("Error reading events:", error);
    return [];
  }
}
