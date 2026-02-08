"use client";

import { ExternalLink, CheckCircle2 } from "lucide-react";
import type { RouteExecutionResult } from "@/lib/lifi/types";
import { CHAIN_NAMES } from "@/lib/lifi/constants";

interface ReceiptListProps {
  result: RouteExecutionResult | null;
  mode: "demo" | "production";
}

export function ReceiptList({ result, mode }: ReceiptListProps) {
  if (!result || !result.success) {
    return null;
  }
  
  const explorerBase = mode === "demo" 
    ? "https://sepolia.etherscan.io"
    : "https://etherscan.io";
  
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div className="font-medium text-slate-900">Route Executed Successfully</div>
      </div>
      
      {result.receivedAmount && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-800">
            <div className="font-medium">Received:</div>
            <div className="text-lg font-semibold mt-1">
              {parseFloat(result.receivedAmount).toFixed(6)} {result.route.toToken.symbol}
            </div>
            {result.receivedAmountUSD && (
              <div className="text-xs text-green-700 mt-1">
                ≈ ${parseFloat(result.receivedAmountUSD).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-700">Transaction Receipts:</div>
        {result.stepReceipts.map((receipt, index) => (
          <div
            key={receipt.stepId}
            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                Step {index + 1}
              </span>
              <span className="text-xs text-slate-500">
                {CHAIN_NAMES[receipt.chainId] || `Chain ${receipt.chainId}`}
              </span>
            </div>
            <a
              href={`${explorerBase}/tx/${receipt.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary-brand hover:opacity-80"
            >
              View
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
        
        {result.finalTxHash && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-slate-600 mb-1">Final Transaction:</div>
            <a
              href={`${explorerBase}/tx/${result.finalTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-mono text-primary-brand hover:opacity-80"
            >
              {result.finalTxHash.slice(0, 20)}...
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
