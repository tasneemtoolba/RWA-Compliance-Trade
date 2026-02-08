"use client";

import { useState, useEffect } from "react";
import { useEnsAddress } from "wagmi";
import { normalize } from "viem/ens";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function RecipientInput({ 
  value, 
  onChange, 
  placeholder = "Enter address or ENS name (e.g., alice.eth)",
  label = "Recipient"
}: RecipientInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isEnsName, setIsEnsName] = useState(false);
  
  // Check if input looks like an ENS name
  useEffect(() => {
    const trimmed = inputValue.trim();
    const looksLikeEns = trimmed.includes(".") && !trimmed.startsWith("0x");
    setIsEnsName(looksLikeEns);
  }, [inputValue]);
  
  // Resolve ENS name to address
  const { data: resolvedAddress, isLoading: isResolving } = useEnsAddress({
    name: isEnsName && inputValue.trim() ? normalize(inputValue.trim()) : undefined,
    query: {
      enabled: isEnsName && inputValue.trim().length > 0,
    },
  });
  
  useEffect(() => {
    if (resolvedAddress) {
      onChange(resolvedAddress);
    } else if (!isEnsName && inputValue.startsWith("0x")) {
      onChange(inputValue);
    }
  }, [resolvedAddress, isEnsName, inputValue, onChange]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };
  
  const getStatusIcon = () => {
    if (isResolving) {
      return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
    }
    if (isEnsName && resolvedAddress) {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (isEnsName && !resolvedAddress && inputValue.trim().length > 0) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (inputValue.startsWith("0x") && inputValue.length === 42) {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    return null;
  };
  
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>
      {isEnsName && resolvedAddress && (
        <p className="text-xs text-slate-600">
          Resolved to: <span className="font-mono">{resolvedAddress}</span>
        </p>
      )}
      {isEnsName && !resolvedAddress && inputValue.trim().length > 0 && !isResolving && (
        <p className="text-xs text-red-600">
          ENS name not found or invalid
        </p>
      )}
    </div>
  );
}
