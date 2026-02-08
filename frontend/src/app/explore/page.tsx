"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { useMode } from "@/hooks/useMode";
import { CONTRACTS, reasonText } from "@/lib/contracts";
import hookAbi from "@/lib/abi/ComplianceHook.json";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight, Copy } from "lucide-react";

export default function ExplorePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mode, setMode } = useMode();
  const [showWhyPrivate, setShowWhyPrivate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const cfg = CONTRACTS.sepolia;
  const isSepolia = chainId === 11155111;

  // Check eligibility for the market
  const { data: eligibilityData, refetch } = useReadContract({
    address: cfg.complianceHook as `0x${string}`,
    abi: hookAbi,
    functionName: "check",
    args: [address ?? "0x0000000000000000000000000000000000000000", cfg.poolId],
    query: { enabled: Boolean(address) && isSepolia },
  });

  const [eligible, reasonCode] = eligibilityData as [boolean, number] || [null, null];

  const getStatusPill = () => {
    if (!isConnected || !isSepolia) {
      return { icon: AlertTriangle, text: "Not configured", color: "bg-slate-100 text-slate-700" };
    }
    if (eligible === true) {
      return { icon: CheckCircle2, text: "Eligible", color: "bg-privacy-brand/10 text-privacy-brand" };
    }
    if (eligible === false) {
      if (reasonCode === 2) {
        return { icon: Clock, text: "Expired", color: "bg-yellow-100 text-yellow-800" };
      }
      return { icon: XCircle, text: "Not Eligible", color: "bg-red-100 text-red-800" };
    }
    return { icon: AlertTriangle, text: "Not configured", color: "bg-slate-100 text-slate-700" };
  };

  const status = getStatusPill();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border bg-gradient-to-r from-primary-brand/5 to-secondary-brand/5 p-6">
        <h1 className="text-3xl font-semibold mb-2">Explore markets</h1>
        <p className="text-slate-700">
          Private eligibility, verifiable enforcement
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-slate-600">Mode:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "demo" | "production")}
            className="rounded-xl border bg-white px-3 py-1.5 text-sm"
          >
            <option value="demo">Demo</option>
            <option value="production">Production</option>
          </select>
        </div>
      </div>

      {/* Market Card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
              </div>
              <h2 className="text-2xl font-semibold">gGOLD</h2>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
              <span>Pair: USDC → gGOLD</span>
              <span>•</span>
              <span>Network: {mode === "demo" ? "Demo (Sepolia)" : "Production (Mainnet)"}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="text-sm text-slate-600">Issuer:</div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded"></div>
                </div>
                <span className="font-medium text-slate-900">atlas-verifier.eth</span>
                <CheckCircle2 className="w-4 h-4 text-privacy-brand" />
              </div>
              <div className="ml-2 text-xs text-slate-500">USSR</div>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1 ml-7">
              <span>10-GNASI</span>
              <button className="text-slate-400 hover:text-slate-600">+</button>
              <button className="text-slate-400 hover:text-slate-600">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${status.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{status.text}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 mt-6">
          <Link
            href="/trade"
            className="flex-1 rounded-xl btn-primary px-4 py-3 font-medium text-center transition"
          >
            Trade
          </Link>
          {mode === "production" ? (
            <Link
              href="/deposit"
              className="flex-1 rounded-xl btn-secondary px-4 py-3 font-medium text-center transition"
            >
              Deposit from anywhere
            </Link>
          ) : (
            <div className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-400 font-medium text-center cursor-not-allowed">
              Deposit from anywhere
            </div>
          )}
        </div>

        {mode === "demo" && (
          <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Deposit is available in Production Mode only (LI.FI doesn't support testnets).
          </div>
        )}

        {/* Why Private */}
        <button
          onClick={() => setShowWhyPrivate(!showWhyPrivate)}
          className="mt-6 w-full flex items-center justify-between text-left text-sm text-slate-700 hover:text-slate-900"
        >
          <span className="font-medium">Why private?</span>
          {showWhyPrivate ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {showWhyPrivate && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl space-y-2 text-sm">
            <div className="flex items-center gap-2 text-privacy-brand">
              <CheckCircle2 className="w-4 h-4" />
              <span>Storing ciphertext only.</span>
            </div>
            <div className="flex items-center gap-2 text-privacy-brand">
              <CheckCircle2 className="w-4 h-4" />
              <span>Hook checks on encrypted profile</span>
            </div>
            <div className="flex items-center gap-2 text-privacy-brand">
              <CheckCircle2 className="w-4 h-4" />
              <span>Only pass/fail is revealed</span>
            </div>
            <button className="mt-3 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1">
              Advanced: :get08499
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-4 w-full flex items-center justify-between text-left text-xs text-slate-600 hover:text-slate-900"
        >
          <span>Advanced</span>
          {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {showAdvanced && (
          <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-2 text-xs font-mono text-slate-700">
            <div>
              <span className="text-slate-600">poolId: </span>
              <span>{cfg.poolId.slice(0, 20)}...</span>
            </div>
            <div>
              <span className="text-slate-600">ruleMask: </span>
              <span>2009</span>
            </div>
          </div>
        )}

        {/* How to qualify */}
        <div className="mt-6 pt-6 border-t">
          <div className="text-xs text-slate-600 space-y-1">
            <div className="font-medium text-slate-700 mb-2">How to qualify:</div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-brand/10 text-primary-brand flex items-center justify-center text-xs font-medium">1</span>
              <Link href="/verify" className="text-link hover:opacity-80">Get Verified</Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-brand/10 text-primary-brand flex items-center justify-center text-xs font-medium">2</span>
              <Link href="/trade" className="text-link hover:opacity-80">Run Hook Check</Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-brand/10 text-primary-brand flex items-center justify-center text-xs font-medium">3</span>
              <span>Swap</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
