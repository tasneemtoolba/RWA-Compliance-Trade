"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { isDemoMode } from "@/lib/demoMode";
import { CONTRACTS, reasonText } from "@/lib/contracts";
import * as hookService from "@/lib/services/hook";
import * as auditService from "@/lib/services/audit";
import * as balancesService from "@/lib/services/balances";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemoBanner } from "@/components/DemoBanner";
import { formatAddress } from "@/lib/helper";

const reasonCodeMap: Record<string, number> = {
  ELIGIBLE: 0,
  NOT_REGISTERED: 1,
  EXPIRED: 2,
  NOT_ELIGIBLE: 3,
  POOL_NOT_CONFIGURED: 4,
};

export default function TradePage() {
  const { address, isConnected } = useAccount();
  const isDemo = isDemoMode();

  const [eligible, setEligible] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkTxHash, setCheckTxHash] = useState<string | null>(null);
  
  // Swap state
  const [swapAmount, setSwapAmount] = useState("100");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<{ success: boolean; txHash?: string; error?: string } | null>(null);
  
  // Audit history
  const [auditHistory, setAuditHistory] = useState(auditService.getHookAudit(address || ""));

  const handleRunCheck = async () => {
    if (!address) return;
    
    setIsChecking(true);
    setCheckTxHash(null);
    
    try {
      const poolId = CONTRACTS.sepolia.poolId;
      const result = await hookService.checkUserCompliance(address, poolId);
      
      setEligible(result.allowed);
      setReason(result.reason);
      setCheckTxHash(result.txHash);
      
      // Refresh audit history
      setAuditHistory(auditService.getHookAudit(address));
    } catch (error: any) {
      console.error("Check error:", error);
      setEligible(false);
      setReason("ERROR");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSwap = async () => {
    if (!address || !eligible) return;
    
    setIsSwapping(true);
    setSwapResult(null);
    
    try {
      const poolId = CONTRACTS.sepolia.poolId;
      const result = await hookService.simulateSwap(
        address,
        poolId,
        "USDC",
        "gGOLD",
        parseFloat(swapAmount)
      );
      
      setSwapResult({ success: true, txHash: result.txHash });
      
      // Refresh balances display would go here
    } catch (error: any) {
      const errorMsg = error.message || "Swap failed";
      setSwapResult({ success: false, error: errorMsg });
    } finally {
      setIsSwapping(false);
    }
  };

  // Load initial check if profile exists
  useEffect(() => {
    if (address && isDemo) {
      handleRunCheck();
    }
  }, [address, isDemo]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Trade</h1>
          <p className="mt-2 text-slate-600">
            Run a hook check to see if swaps would be allowed; simulate swap outcomes.
          </p>
        </div>
        <DemoBanner />
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600 mb-4">Connect wallet to trade</p>
          <Button className="btn-primary">Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Trade</h1>
        <p className="mt-2 text-slate-600">
          Run a hook check to see if swaps would be allowed; simulate swap outcomes.
        </p>
      </div>

      <DemoBanner />

      {/* Two Cards Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hook Check Card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Hook Check</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {eligible === true ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-600">Eligible</span>
                </>
              ) : eligible === false ? (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-600">Not eligible</span>
                </>
              ) : (
                <span className="text-slate-600">Status: Not checked</span>
              )}
            </div>

            {eligible !== null && reason && (
              <div className="space-y-2">
                {eligible ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    <div className="font-medium mb-1">Hook would allow swaps for this pool.</div>
                    <div className="text-xs text-green-700">
                      Your encrypted profile satisfies the pool's compliance rules.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <div className="font-medium mb-1">
                      Hook would block swaps: rule mismatch
                    </div>
                    <div className="text-xs text-red-700 mt-1">
                      Reason: {reason}
                    </div>
                    {reason === "NOT_REGISTERED" && (
                      <Link href="/verify" className="inline-block mt-2 text-xs text-link hover:opacity-80">
                        Go to Get Verified →
                      </Link>
                    )}
                  </div>
                )}
                {checkTxHash && (
                  <div className="text-xs text-slate-500 font-mono">
                    Tx: {checkTxHash.slice(0, 20)}...
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleRunCheck}
              disabled={!isConnected || isChecking}
              className="w-full btn-primary"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Run check"
              )}
            </Button>

            {/* Hook Audit */}
            {auditHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-slate-700 mb-2">Recent Checks</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {auditHistory.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-center justify-between">
                      <span>{new Date(entry.ts).toLocaleTimeString()}</span>
                      <span className={entry.allowed ? "text-green-600" : "text-red-600"}>
                        {entry.allowed ? "✓" : "✗"} {entry.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Swap Simulation Card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Swap Simulation</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border border-slate-200">
                <Image
                  src="/usdc-icon.png"
                  alt="USDC"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="100"
                  className="text-lg"
                />
                <div className="text-xs text-slate-500 mt-1">USDC</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center text-slate-400">
              <span className="text-xl">↓</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border border-slate-200">
                <Image
                  src="/assets/ggold.png"
                  alt="gGOLD"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="text-lg font-medium">gGOLD</div>
                <div className="text-xs text-slate-500">Estimated: ~{parseFloat(swapAmount) * 0.001} gGOLD</div>
              </div>
            </div>

            {eligible === true ? (
              <div className="text-sm text-green-700">
                ✅ Eligible - Swap would be allowed by hook
              </div>
            ) : eligible === false ? (
              <div className="text-sm text-red-700">
                ❌ Not eligible - Swap would be blocked
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                Tip: Run hook check first to verify eligibility.
              </div>
            )}

            {swapResult && (
              <div className={`rounded-xl border p-3 ${
                swapResult.success 
                  ? "border-green-200 bg-green-50" 
                  : "border-red-200 bg-red-50"
              }`}>
                {swapResult.success ? (
                  <div className="text-sm text-green-800">
                    <div className="font-medium">Swap successful!</div>
                    {swapResult.txHash && (
                      <div className="text-xs font-mono mt-1">Tx: {swapResult.txHash.slice(0, 20)}...</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-800">
                    <div className="font-medium">Swap blocked: {swapResult.error}</div>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleSwap}
              disabled={eligible !== true || isSwapping || !swapAmount}
              className="w-full btn-primary"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : eligible === true ? (
                "Swap (demo)"
              ) : (
                "Swap (complete Get Verified first)"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tip Section */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold">Tip</h3>
        </div>
        <div className="text-sm text-slate-700 space-y-2">
          <p>Run check returns pass/fail only — no attributes are revealed.</p>
          <p>Hook checks (userBitmap & ruleMask) == ruleMask and allows/blocks swaps.</p>
          <p>Only pass/fail + reason code is revealed (no attributes).</p>
        </div>
      </div>
    </div>
  );
}
