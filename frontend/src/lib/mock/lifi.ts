/**
 * Mock LI.FI Flow
 * Simulates cross-chain route building and execution
 */

import { fakeTxHash, delay, creditBalance } from "./onchain";

export interface RouteStep {
  stepNumber: number;
  type: "swap" | "bridge" | "approve";
  description: string;
  chainId: number;
  estimatedTime: number;
}

export interface Route {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromToken: { symbol: string; address: string };
  toToken: { symbol: string; address: string };
  fromAmount: string;
  toAmount: string;
  toAmountUSD: string;
  steps: RouteStep[];
  estimatedTime: number;
  estimatedGas: string;
  tags?: string[];
  gasCosts?: Array<{ amountUSD: string }>;
}

export interface RouteExecutionUpdate {
  step: RouteStep;
  status: "pending" | "done" | "failed";
  process: {
    txHash: string;
  };
}

/**
 * Get available routes
 */
export async function getRoutes(params: {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
}): Promise<Route[]> {
  await delay(1000);
  
  const fromAmountNum = parseFloat(params.fromAmount);
  const toAmountNum = fromAmountNum * 0.99; // 1% slippage for demo
  
  const steps: RouteStep[] = [];
  
  // Step 1: Swap if needed
  if (params.fromToken !== params.toToken) {
    steps.push({
      stepNumber: 1,
      type: "swap",
      description: `Swap ${params.fromToken} → USDC on ${getChainName(params.fromChainId)}`,
      chainId: params.fromChainId,
      estimatedTime: 30,
    });
  }
  
  // Step 2: Bridge
  steps.push({
    stepNumber: steps.length + 1,
    type: "bridge",
    description: `Bridge USDC from ${getChainName(params.fromChainId)} → ${getChainName(params.toChainId)}`,
    chainId: params.fromChainId,
    estimatedTime: 120,
  });
  
  // Step 3: Approve (optional, for Composer bounty)
  steps.push({
    stepNumber: steps.length + 1,
    type: "approve",
    description: `Approve USDC for SwapRouter on ${getChainName(params.toChainId)}`,
    chainId: params.toChainId,
    estimatedTime: 15,
  });
  
  const totalTime = steps.reduce((sum, s) => sum + s.estimatedTime, 0);
  
  // Generate 3 route options
  const routes: Route[] = [
    {
      id: "route_1",
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      fromToken: { symbol: getTokenSymbol(params.fromToken), address: params.fromToken },
      toToken: { symbol: "USDC", address: params.toToken },
      fromAmount: params.fromAmount,
      toAmount: toAmountNum.toFixed(6),
      toAmountUSD: (toAmountNum * 1.0).toFixed(2),
      steps,
      estimatedTime: totalTime,
      estimatedGas: "0.001",
      tags: ["RECOMMENDED"],
      gasCosts: [{ amountUSD: "0.50" }],
    },
    {
      id: "route_2",
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      fromToken: { symbol: getTokenSymbol(params.fromToken), address: params.fromToken },
      toToken: { symbol: "USDC", address: params.toToken },
      fromAmount: params.fromAmount,
      toAmount: (toAmountNum * 0.995).toFixed(6),
      toAmountUSD: (toAmountNum * 0.995).toFixed(2),
      steps: steps.slice(0, 2), // No approve step
      estimatedTime: totalTime - 15,
      estimatedGas: "0.0008",
      tags: ["FASTEST"],
      gasCosts: [{ amountUSD: "0.40" }],
    },
    {
      id: "route_3",
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      fromToken: { symbol: getTokenSymbol(params.fromToken), address: params.fromToken },
      toToken: { symbol: "USDC", address: params.toToken },
      fromAmount: params.fromAmount,
      toAmount: (toAmountNum * 0.998).toFixed(6),
      toAmountUSD: (toAmountNum * 0.998).toFixed(2),
      steps,
      estimatedTime: totalTime + 30,
      estimatedGas: "0.0005",
      tags: ["CHEAPEST"],
      gasCosts: [{ amountUSD: "0.30" }],
    },
  ];
  
  return routes;
}

/**
 * Execute a route
 */
export async function executeRoute(
  wallet: string,
  route: Route,
  onProgress?: (update: RouteExecutionUpdate) => void
): Promise<{
  success: boolean;
  stepReceipts: Array<{ stepId: string; chainId: number; txHash: string }>;
  finalTxHash: string;
  receivedAmount: string;
  receivedAmountUSD: string;
}> {
  const stepReceipts: Array<{ stepId: string; chainId: number; txHash: string }> = [];
  
  for (const step of route.steps) {
    // Notify progress
    if (onProgress) {
      onProgress({
        step,
        status: "pending",
        process: { txHash: "" },
      });
    }
    
    // Simulate step execution
    await delay(800 + Math.random() * 700); // 800-1500ms
    
    const txHash = await fakeTxHash(`route_${route.id}_step_${step.stepNumber}_${wallet}`);
    stepReceipts.push({
      stepId: step.stepNumber.toString(),
      chainId: step.chainId,
      txHash,
    });
    
    // Notify progress
    if (onProgress) {
      onProgress({
        step,
        status: "done",
        process: { txHash },
      });
    }
  }
  
  // Credit balance on destination chain
  const receivedAmount = parseFloat(route.toAmount);
  creditBalance(wallet, route.toToken.symbol, receivedAmount);
  
  const finalTxHash = await fakeTxHash(`route_${route.id}_complete_${wallet}`);
  
  return {
    success: true,
    stepReceipts,
    finalTxHash,
    receivedAmount: route.toAmount,
    receivedAmountUSD: route.toAmountUSD,
  };
}

function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    8453: "Base",
    42161: "Arbitrum",
    1: "Ethereum",
    11155111: "Sepolia",
  };
  return names[chainId] || `Chain ${chainId}`;
}

function getTokenSymbol(address: string): string {
  if (address === "0x0000000000000000000000000000000000000000") return "ETH";
  if (address.toLowerCase().includes("usdc")) return "USDC";
  if (address.toLowerCase().includes("usdt")) return "USDT";
  return "TOKEN";
}
