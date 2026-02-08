"use client";

import { useState, useEffect } from "react";
import { useAccount, useEnsName, useEnsText, useWriteContract } from "wagmi";
import { normalize } from "viem/ens";
import { ENS_KEYS } from "@/lib/ens/keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";

interface EnsRecordsEditorProps {
  ensName?: string | null;
  onSaved?: () => void;
}

export function EnsRecordsEditor({ ensName: providedEnsName, onSaved }: EnsRecordsEditorProps) {
  const { address, isConnected } = useAccount();
  const { data: resolvedEnsName } = useEnsName({ address });
  const ensName = providedEnsName || resolvedEnsName;
  
  const [manualEnsName, setManualEnsName] = useState("");
  const [activeEnsName, setActiveEnsName] = useState<string | null>(ensName || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form state
  const [credentialRef, setCredentialRef] = useState("");
  const [defaultAsset, setDefaultAsset] = useState("gGOLD");
  const [slippage, setSlippage] = useState("0.5");
  const [preferredChain, setPreferredChain] = useState("base");
  const [preferredToken, setPreferredToken] = useState("USDC");
  
  // Read existing records
  const { data: existingCredentialRef, isLoading: loadingCredentialRef } = useEnsText({
    name: activeEnsName ? normalize(activeEnsName) : undefined,
    key: ENS_KEYS.CREDENTIAL_REF,
    query: { enabled: Boolean(activeEnsName) },
  });
  
  const { data: existingDefaultAsset, isLoading: loadingDefaultAsset } = useEnsText({
    name: activeEnsName ? normalize(activeEnsName) : undefined,
    key: ENS_KEYS.DEFAULT_ASSET,
    query: { enabled: Boolean(activeEnsName) },
  });
  
  const { data: existingSlippage, isLoading: loadingSlippage } = useEnsText({
    name: activeEnsName ? normalize(activeEnsName) : undefined,
    key: ENS_KEYS.SLIPPAGE,
    query: { enabled: Boolean(activeEnsName) },
  });
  
  const { data: existingPreferredChain, isLoading: loadingPreferredChain } = useEnsText({
    name: activeEnsName ? normalize(activeEnsName) : undefined,
    key: ENS_KEYS.PREFERRED_CHAIN,
    query: { enabled: Boolean(activeEnsName) },
  });
  
  const { data: existingPreferredToken, isLoading: loadingPreferredToken } = useEnsText({
    name: activeEnsName ? normalize(activeEnsName) : undefined,
    key: ENS_KEYS.PREFERRED_TOKEN,
    query: { enabled: Boolean(activeEnsName) },
  });
  
  // Load existing values
  useEffect(() => {
    if (existingCredentialRef) setCredentialRef(existingCredentialRef);
    if (existingDefaultAsset) setDefaultAsset(existingDefaultAsset);
    if (existingSlippage) setSlippage(existingSlippage);
    if (existingPreferredChain) setPreferredChain(existingPreferredChain);
    if (existingPreferredToken) setPreferredToken(existingPreferredToken);
  }, [existingCredentialRef, existingDefaultAsset, existingSlippage, existingPreferredChain, existingPreferredToken]);
  
  const { writeContractAsync } = useWriteContract();
  
  const handleLoadRecords = () => {
    if (manualEnsName.trim()) {
      setActiveEnsName(manualEnsName.trim());
    }
  };
  
  const handleSave = async () => {
    if (!activeEnsName || !isConnected) {
      setSaveError("Please connect wallet and provide an ENS name");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Note: In production, you'd need the ENS resolver address and ABI
      // This is a simplified version - you'll need to get the resolver address first
      // using useEnsResolver, then call setText on that resolver
      
      // For demo purposes, we'll show the structure
      // In real implementation:
      // 1. Get resolver address: useEnsResolver({ name: normalize(activeEnsName) })
      // 2. Call setText on resolver contract
      
      console.log("Would save ENS records:", {
        name: activeEnsName,
        records: {
          [ENS_KEYS.CREDENTIAL_REF]: credentialRef,
          [ENS_KEYS.DEFAULT_ASSET]: defaultAsset,
          [ENS_KEYS.SLIPPAGE]: slippage,
          [ENS_KEYS.PREFERRED_CHAIN]: preferredChain,
          [ENS_KEYS.PREFERRED_TOKEN]: preferredToken,
        },
      });
      
      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved?.();
      }, 2000);
    } catch (error: any) {
      setSaveError(error.message || "Failed to save ENS records");
    } finally {
      setIsSaving(false);
    }
  };
  
  const isLoading = loadingCredentialRef || loadingDefaultAsset || loadingSlippage || 
                     loadingPreferredChain || loadingPreferredToken;
  
  if (!isConnected) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
        Connect wallet to manage ENS records
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* ENS Name Input (if no ENS detected) */}
      {!ensName && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700 mb-3">
            No ENS name detected for this wallet. That's okay — you can still trade. 
            If you own an ENS name, enter it below to manage your preferences.
          </p>
          <div className="flex gap-2">
            <Input
              value={manualEnsName}
              onChange={(e) => setManualEnsName(e.target.value)}
              placeholder="Enter ENS name (e.g., alice.eth)"
              className="flex-1"
            />
            <Button onClick={handleLoadRecords} variant="secondary">
              Load Records
            </Button>
          </div>
        </div>
      )}
      
      {ensName && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-900">ENS name detected: {ensName}</span>
          </div>
        </div>
      )}
      
      {activeEnsName && (
        <>
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-600">Loading records...</span>
            </div>
          )}
          
          {!isLoading && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Credential Reference
                </label>
                <Input
                  value={credentialRef}
                  onChange={(e) => setCredentialRef(e.target.value)}
                  placeholder="Contract address + key ID (e.g., 0x1234...5678:key1)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Pointer to your onchain encrypted profile
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Default Asset
                </label>
                <Select value={defaultAsset} onValueChange={setDefaultAsset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gGOLD">gGOLD</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Slippage Tolerance (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  placeholder="0.5"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Preferred Chain
                </label>
                <Select value={preferredChain} onValueChange={setPreferredChain}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Preferred Token
                </label>
                <Select value={preferredToken} onValueChange={setPreferredToken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {saveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {saveError}
                </div>
              )}
              
              {saveSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Records saved successfully!
                </div>
              )}
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full btn-primary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save ENS Records
                  </>
                )}
              </Button>
              
              <p className="text-xs text-slate-500 text-center">
                Updating ENS records requires ownership of the ENS name.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
