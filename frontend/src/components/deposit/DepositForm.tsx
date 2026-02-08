"use client";

import { useState, useEffect } from "react";
import { useAccount, useEnsName, useEnsText } from "wagmi";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOURCE_CHAINS, DEFAULT_TOKENS, DESTINATION_CONFIG } from "@/lib/lifi/constants";
import { ENS_KEYS } from "@/lib/ens/keys";
import { normalize } from "viem/ens";

interface DepositFormProps {
  fromChain: number;
  fromToken: string;
  amount: string;
  onFromChainChange: (chainId: number) => void;
  onFromTokenChange: (token: string) => void;
  onAmountChange: (amount: string) => void;
  mode: "demo" | "production";
}

export function DepositForm({
  fromChain,
  fromToken,
  amount,
  onFromChainChange,
  onFromTokenChange,
  onAmountChange,
  mode,
}: DepositFormProps) {
  const { address } = useAccount();
  const { data: userENS } = useEnsName({ address: address || undefined });
  
  // Read ENS preferences
  const { data: preferredChain } = useEnsText({
    name: userENS || undefined,
    key: ENS_KEYS.PREFERRED_CHAIN,
    query: { enabled: Boolean(userENS) },
  });
  
  const { data: preferredToken } = useEnsText({
    name: userENS || undefined,
    key: ENS_KEYS.PREFERRED_TOKEN,
    query: { enabled: Boolean(userENS) },
  });
  
  // Prefill from ENS preferences
  useEffect(() => {
    if (preferredChain && address) {
      const chainMap: Record<string, number> = {
        base: 8453,
        arbitrum: 42161,
        ethereum: 1,
      };
      const chainId = chainMap[preferredChain.toLowerCase()];
      if (chainId) {
        onFromChainChange(chainId);
      }
    }
  }, [preferredChain, address, onFromChainChange]);
  
  useEffect(() => {
    if (preferredToken && fromChain) {
      const tokens = DEFAULT_TOKENS[fromChain] || [];
      const token = tokens.find(
        (t) => t.symbol.toUpperCase() === preferredToken.toUpperCase()
      );
      if (token) {
        onFromTokenChange(token.address);
      }
    }
  }, [preferredToken, fromChain, onFromTokenChange]);
  
  const availableTokens = DEFAULT_TOKENS[fromChain] || [];
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          From Chain
        </label>
        <Select
          value={fromChain.toString()}
          onValueChange={(value) => onFromChainChange(Number(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_CHAINS.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {userENS && preferredChain && (
          <p className="text-xs text-slate-500 mt-1">
            Prefilled from ENS: {preferredChain}
          </p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          From Token
        </label>
        <Select
          value={fromToken}
          onValueChange={onFromTokenChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableTokens.map((token) => (
              <SelectItem key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {userENS && preferredToken && (
          <p className="text-xs text-slate-500 mt-1">
            Prefilled from ENS: {preferredToken}
          </p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Amount
        </label>
        <Input
          type="number"
          step="0.000001"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.0"
        />
      </div>
      
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm text-slate-600 mb-1">Destination (Fixed)</div>
        <div className="font-medium">
          {DESTINATION_CONFIG.chainId === 11155111 ? "Sepolia" : "Ethereum"} - {DESTINATION_CONFIG.tokenSymbol}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Funds will arrive on {DESTINATION_CONFIG.chainId === 11155111 ? "Sepolia" : "Ethereum"} for trading
        </div>
      </div>
    </div>
  );
}
