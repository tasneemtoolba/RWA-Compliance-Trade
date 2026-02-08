/**
 * LI.FI SDK Types
 */

export interface RouteStep {
  id: string;
  type: "swap" | "bridge" | "call";
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
  action: {
    fromChainId: number;
    fromAmount: string;
    fromToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
    toChainId: number;
    toAmount: string;
    toToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
    slippage: number;
    fromAddress: string;
    toAddress: string;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    approvalAddress: string;
    executionDuration: number;
  };
  transactionRequest?: {
    data: string;
    to: string;
    value: string;
    gasLimit: string;
    gasPrice?: string;
  };
}

export interface Route {
  id: string;
  fromChainId: number;
  fromAmount: string;
  fromAmountUSD: string;
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toChainId: number;
  toAmount: string;
  toAmountUSD: string;
  toAmountMin: string;
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  gasCosts?: Array<{
    type: string;
    price: string;
    estimate: string;
    limit: string;
    amount: string;
    amountUSD: string;
    token: {
      address: string;
      symbol: string;
      decimals: number;
    };
  }>;
  steps: RouteStep[];
  tags: string[];
}

export interface RouteExecutionUpdate {
  route: Route;
  step: RouteStep;
  status: "pending" | "action_required" | "done" | "failed";
  process: {
    status: string;
    message?: string;
    txHash?: string;
    txLink?: string;
  };
}

export interface RouteExecutionResult {
  route: Route;
  stepReceipts: Array<{
    stepId: string;
    txHash: string;
    chainId: number;
    status: "success" | "failed";
  }>;
  finalTxHash: string;
  success: boolean;
  receivedAmount?: string;
  receivedAmountUSD?: string;
}
