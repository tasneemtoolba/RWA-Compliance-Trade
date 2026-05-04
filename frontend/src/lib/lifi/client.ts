/**
 * LI.FI SDK Client Wrapper
 * 
 * This file provides a clean interface to LI.FI SDK for fetching routes and executing them.
 * 
 * IMPORTANT: LI.FI no longer supports testnets. This client:
 * - Validates chain IDs using getChains() before calling getRoutes()
 * - Uses mock routes for testnets instead of calling the API
 * - Always uses mainnet API (https://li.quest/v1)
 */

import type { Route, RouteExecutionUpdate, RouteExecutionResult } from "./types";
import { getLifiConfig } from "./config";

// Dynamic import to avoid SSR issues
let lifiSDK: any = null;
let supportedChainIds: Set<number> | null = null;
let configInitialized: boolean = false;

// Testnet chain IDs that LI.FI doesn't support
const TESTNET_CHAIN_IDS = new Set([
  11155111,  // Sepolia
  84532,     // Base Sepolia
  421614,    // Arbitrum Sepolia
  11155420,  // Optimism Sepolia
]);

async function getLifiSDK() {
  if (lifiSDK) return lifiSDK;

  try {
    // Try to import @lifi/sdk
    // LI.FI SDK v3 exports getRoutes and executeRoute as direct functions
    const lifiModule = await import("@lifi/sdk");
    
    // Initialize SDK config with mainnet API (testnets not supported)
    if (!configInitialized) {
      await getLifiConfig();
      configInitialized = true;
    }
    
    lifiSDK = lifiModule;
    return lifiSDK;
  } catch (error) {
    console.warn("@lifi/sdk not installed, using mock implementation");
    return null;
  }
}

/**
 * Get supported chain IDs from LI.FI
 * Caches the result to avoid repeated API calls
 */
async function getSupportedChainIds(): Promise<Set<number>> {
  if (supportedChainIds) return supportedChainIds;

  const sdk = await getLifiSDK();
  if (!sdk) {
    // If SDK is not available, return empty set (will use mocks)
    return new Set();
  }

  try {
    const { getChains, ChainType } = sdk;
    if (!getChains) {
      console.warn("LI.FI SDK getChains not found");
      return new Set();
    }

    const chains = await getChains({ chainTypes: [ChainType.EVM] });
    supportedChainIds = new Set(chains.map((c: any) => c.id));
    return supportedChainIds;
  } catch (error) {
    console.error("Failed to fetch supported chains from LI.FI:", error);
    return new Set();
  }
}

/**
 * Check if a chain ID is a testnet
 */
function isTestnet(chainId: number): boolean {
  return TESTNET_CHAIN_IDS.has(chainId);
}

/**
 * Check if a chain ID is supported by LI.FI
 */
async function isChainSupported(chainId: number): Promise<boolean> {
  // Testnets are never supported
  if (isTestnet(chainId)) {
    return false;
  }

  // Check against LI.FI's supported chains
  const supported = await getSupportedChainIds();
  return supported.has(chainId);
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
 * 
 * IMPORTANT: If either fromChainId or toChainId is a testnet or not supported by LI.FI,
 * this function will return mock routes instead of calling the API.
 */
export async function fetchRoutes(params: GetRoutesParams): Promise<Route[]> {
  const sdk = await getLifiSDK();

  if (!sdk) {
    // Mock implementation for demo when SDK is not available
    return getMockRoutes(params);
  }

  // Check if chains are supported by LI.FI
  const fromSupported = await isChainSupported(params.fromChainId);
  const toSupported = await isChainSupported(params.toChainId);

  // If either chain is not supported (testnet or not in LI.FI's list), use mock routes
  if (!fromSupported || !toSupported) {
    const unsupportedChains: number[] = [];
    if (!fromSupported) unsupportedChains.push(params.fromChainId);
    if (!toSupported) unsupportedChains.push(params.toChainId);

    console.warn(
      `Chain(s) ${unsupportedChains.join(", ")} not supported by LI.FI. ` +
      `LI.FI no longer supports testnets. Using mock routes for demo.`
    );

    // Return mock routes with a flag indicating this is a simulation
    return getMockRoutes(params, true);
  }

  try {
    // LI.FI SDK v3 API: getRoutes is exported as a direct function
    const { getRoutes } = sdk;
    if (!getRoutes) {
      throw new Error("LI.FI SDK getRoutes not found");
    }

    const response = await getRoutes({
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

    return response.routes || [];
  } catch (error: any) {
    // If we get a 400 error about chain validation, it means the chain isn't supported
    // even though it passed our initial check (edge case)
    if (error.message?.includes("must be equal to one of the allowed values") ||
        error.message?.includes("fromChainId") ||
        error.message?.includes("toChainId")) {
      console.warn(
        `LI.FI rejected chain ID(s). Using mock routes instead. ` +
        `Error: ${error.message}`
      );
      return getMockRoutes(params, true);
    }

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
    const signer = await options.getSigner();

    // LI.FI SDK v3 API: executeRoute is exported as a direct function
    const { executeRoute: lifiExecuteRoute } = sdk;
    if (!lifiExecuteRoute) {
      throw new Error("LI.FI SDK executeRoute not found");
    }

    // Execute route with update callback
    const result = await lifiExecuteRoute({
      route,
      signer,
      updateCallback: options.onUpdate,
    });

    // Extract step receipts from result
    const stepReceipts = route.steps.map((step, index) => ({
      stepId: step.id,
      txHash: result.stepReceipts?.[index]?.txHash || "",
      chainId: step.action.toChainId,
      status: result.stepReceipts?.[index]?.status === "DONE" ? "success" as const : "failed" as const,
    }));

    return {
      route,
      stepReceipts,
      finalTxHash: stepReceipts[stepReceipts.length - 1]?.txHash || "",
      success: result.status === "DONE",
      receivedAmount: result.toAmount || route.toAmount,
      receivedAmountUSD: result.toAmountUSD || route.toAmountUSD,
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

// Mock implementations for when SDK is not available or testnets are used
function getMockRoutes(params: GetRoutesParams, isSimulation: boolean = false): Route[] {
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
      tags: isSimulation ? ["simulation", "demo"] : ["recommended"],
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
