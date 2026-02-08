/**
 * LI.FI SDK Client Wrapper
 * 
 * This file provides a clean interface to LI.FI SDK for fetching routes and executing them.
 */

import type { Route, RouteExecutionUpdate, RouteExecutionResult } from "./types";

// Dynamic import to avoid SSR issues
let lifiSDK: any = null;

async function getLifiSDK() {
  if (lifiSDK) return lifiSDK;
  
  try {
    // Try to import @lifi/sdk
    const lifiModule = await import("@lifi/sdk");
    lifiSDK = lifiModule;
    return lifiSDK;
  } catch (error) {
    console.warn("@lifi/sdk not installed, using mock implementation");
    return null;
  }
}

export interface GetRoutesParams {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string; // in wei string
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
}

/**
 * Fetch routes from LI.FI
 */
export async function fetchRoutes(params: GetRoutesParams): Promise<Route[]> {
  const sdk = await getLifiSDK();
  
  if (!sdk) {
    // Mock implementation for demo when SDK is not available
    return getMockRoutes(params);
  }
  
  try {
    const { getRoutes } = sdk;
    const routes = await getRoutes({
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      fromTokenAddress: params.fromToken,
      toTokenAddress: params.toToken,
      fromAmount: params.fromAmount,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      options: {
        maxPriceImpact: 0.5, // 50% max slippage
        order: "RECOMMENDED", // or "FASTEST", "CHEAPEST"
      },
    });
    
    return routes.routes || [];
  } catch (error: any) {
    console.error("Error fetching LI.FI routes:", error);
    throw new Error(`Failed to fetch routes: ${error.message}`);
  }
}

/**
 * Execute a LI.FI route
 */
export async function executeRoute(
  route: Route,
  options: {
    getSigner: () => Promise<any>; // wagmi/viem signer
    onUpdate?: (update: RouteExecutionUpdate) => void;
  }
): Promise<RouteExecutionResult> {
  const sdk = await getLifiSDK();
  
  if (!sdk) {
    // Mock implementation
    return executeMockRoute(route, options);
  }
  
  try {
    const { executeRoute: lifiExecuteRoute } = sdk;
    
    const result = await lifiExecuteRoute({
      route,
      signer: await options.getSigner(),
      updateCallback: options.onUpdate,
    });
    
    return {
      route,
      stepReceipts: result.stepReceipts || [],
      finalTxHash: result.finalTxHash || "",
      success: result.success || false,
      receivedAmount: result.receivedAmount,
      receivedAmountUSD: result.receivedAmountUSD,
    };
  } catch (error: any) {
    console.error("Error executing LI.FI route:", error);
    throw new Error(`Failed to execute route: ${error.message}`);
  }
}

/**
 * Format route steps for UI display
 */
export function formatSteps(route: Route): Array<{
  stepNumber: number;
  type: string;
  description: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  estimatedTime?: string;
}> {
  return route.steps.map((step, index) => ({
    stepNumber: index + 1,
    type: step.type,
    description: step.action.fromToken.symbol === step.action.toToken.symbol
      ? `Bridge ${step.action.fromAmount} ${step.action.fromToken.symbol} from ${step.action.fromChainId} to ${step.action.toChainId}`
      : `Swap ${step.action.fromAmount} ${step.action.fromToken.symbol} for ${step.action.toAmount} ${step.action.toToken.symbol}`,
    fromChain: step.action.fromChainId.toString(),
    toChain: step.action.toChainId.toString(),
    fromToken: step.action.fromToken.symbol,
    toToken: step.action.toToken.symbol,
    estimatedTime: step.estimate?.executionDuration
      ? `${Math.ceil(step.estimate.executionDuration / 60)} min`
      : undefined,
  }));
}

// Mock implementations for when SDK is not available
function getMockRoutes(params: GetRoutesParams): Route[] {
  return [
    {
      id: "mock-route-1",
      fromChainId: params.fromChainId,
      fromAmount: params.fromAmount,
      fromAmountUSD: "0",
      fromToken: {
        address: params.fromToken,
        symbol: "ETH",
        decimals: 18,
      },
      toChainId: params.toChainId,
      toAmount: params.fromAmount, // Simplified
      toAmountUSD: "0",
      toAmountMin: params.fromAmount,
      toToken: {
        address: params.toToken,
        symbol: "USDC",
        decimals: 6,
      },
      steps: [
        {
          id: "step-1",
          type: "swap",
          tool: "mock-swap",
          toolDetails: {
            key: "mock",
            name: "Mock Swap",
            logoURI: "",
          },
          action: {
            fromChainId: params.fromChainId,
            fromAmount: params.fromAmount,
            fromToken: {
              address: params.fromToken,
              symbol: "ETH",
              decimals: 18,
            },
            toChainId: params.fromChainId,
            toAmount: params.fromAmount,
            toToken: {
              address: params.toToken,
              symbol: "USDC",
              decimals: 6,
            },
            slippage: 0.5,
            fromAddress: params.fromAddress,
            toAddress: params.toAddress,
          },
          estimate: {
            fromAmount: params.fromAmount,
            toAmount: params.fromAmount,
            toAmountMin: params.fromAmount,
            approvalAddress: params.fromAddress,
            executionDuration: 300,
          },
        },
        {
          id: "step-2",
          type: "bridge",
          tool: "mock-bridge",
          toolDetails: {
            key: "mock",
            name: "Mock Bridge",
            logoURI: "",
          },
          action: {
            fromChainId: params.fromChainId,
            fromAmount: params.fromAmount,
            fromToken: {
              address: params.toToken,
              symbol: "USDC",
              decimals: 6,
            },
            toChainId: params.toChainId,
            toAmount: params.fromAmount,
            toToken: {
              address: params.toToken,
              symbol: "USDC",
              decimals: 6,
            },
            slippage: 0.5,
            fromAddress: params.fromAddress,
            toAddress: params.toAddress,
          },
          estimate: {
            fromAmount: params.fromAmount,
            toAmount: params.fromAmount,
            toAmountMin: params.fromAmount,
            approvalAddress: params.fromAddress,
            executionDuration: 600,
          },
        },
      ],
      tags: ["recommended"],
    },
  ] as Route[];
}

async function executeMockRoute(
  route: Route,
  options: {
    getSigner: () => Promise<any>;
    onUpdate?: (update: RouteExecutionUpdate) => void;
  }
): Promise<RouteExecutionResult> {
  const stepReceipts: RouteExecutionResult["stepReceipts"] = [];
  
  for (const step of route.steps) {
    if (options.onUpdate) {
      options.onUpdate({
        route,
        step,
        status: "pending",
        process: {
          status: "PENDING",
          message: `Executing ${step.type}...`,
        },
      });
    }
    
    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const txHash = `0x${Math.random().toString(16).slice(2).padStart(64, "0")}`;
    
    if (options.onUpdate) {
      options.onUpdate({
        route,
        step,
        status: "done",
        process: {
          status: "DONE",
          txHash,
          txLink: `https://etherscan.io/tx/${txHash}`,
        },
      });
    }
    
    stepReceipts.push({
      stepId: step.id,
      txHash,
      chainId: step.action.toChainId,
      status: "success",
    });
  }
  
  return {
    route,
    stepReceipts,
    finalTxHash: stepReceipts[stepReceipts.length - 1]?.txHash || "",
    success: true,
    receivedAmount: route.toAmount,
    receivedAmountUSD: route.toAmountUSD,
  };
}
