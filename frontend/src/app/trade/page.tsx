"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, reasonText } from "@/lib/contracts";
import hookAbi from "@/lib/abi/ComplianceHook.json";
import { defaultRuleMask } from "@/lib/bitmap";
import Link from "next/link";

export default function TradePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const cfg = CONTRACTS.sepolia;
  const isSepolia = chainId === 11155111;

  const [eligible, setEligible] = useState<boolean | null>(null);
  const [reason, setReason] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");

  // Call hook.check(user,poolId)
  const { data, refetch } = useReadContract({
    address: cfg.complianceHook as `0x${string}`,
    abi: hookAbi,
    functionName: "check",
    args: [address ?? "0x0000000000000000000000000000000000000000", cfg.poolId],
    query: { enabled: Boolean(address) && isSepolia },
  });

  useEffect(() => {
    if (!data) return;
    const arr = data as unknown as [boolean, number];
    setEligible(arr[0]);
    setReason(arr[1]);
  }, [data]);

  async function configurePoolRule() {
    if (!isConnected || !address) return;
    if (!isSepolia) {
      setStatus("Switch network to Sepolia.");
      return;
    }
    setStatus("Setting pool rule mask...");
    const mask = defaultRuleMask();
    try {
      await writeContractAsync({
        address: cfg.complianceHook as `0x${string}`,
        abi: hookAbi,
        functionName: "setPoolRuleMask",
        args: [cfg.poolId, mask],
      });
      setStatus("✅ Pool configured. Re-check eligibility.");
      await refetch();
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold">Trade</h1>
        <span className="text-blue-500 text-2xl">☰</span>
      </div>
      <p className="text-slate-600">
        MVP shows eligibility check (trade UI comes next).
      </p>

      {/* Two Cards Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hook Check Card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Hook Check</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {eligible === true ? (
                <>
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="font-medium">Eligible</span>
                </>
              ) : eligible === false ? (
                <>
                  <span className="text-red-600 text-xl">❌</span>
                  <span className="font-medium text-red-600">Not eligible</span>
                </>
              ) : (
                <span className="text-slate-600">Status: Not checked</span>
              )}
            </div>

            {eligible !== null && (
              <div>
                <div className="text-sm text-slate-600">Reason:</div>
                <div className="mt-1 text-sm font-medium">
                  Code: {reason !== null ? reason : "-"} &gt; {reason !== null ? reasonText[reason] : "OK"}
                </div>
              </div>
            )}

            <button
              onClick={() => refetch()}
              disabled={!isConnected || !isSepolia}
              className="w-full rounded-xl btn-primary px-4 py-3 font-medium transition"
            >
              Run check
            </button>
          </div>
        </div>

        {/* Swap Simulation Card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Swap Simulation</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">+</span>
              </div>
              <span className="font-medium">100.00 USDC</span>
            </div>

            <div className="text-sm text-slate-600">
              Tip: Go to <Link href="/verify" className="text-link hover:opacity-80">Get Verified</Link> first.
            </div>

            <button
              disabled
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-400 font-medium cursor-not-allowed"
            >
              Swap (coming next)
            </button>
          </div>
        </div>
      </div>

      {/* Tip Section */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">☰</span>
          <h3 className="text-lg font-semibold">Tip</h3>
        </div>
        <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
          <li>Create an eligible profile.</li>
          <li>Create a second wallet with a non-eligible profile.</li>
          <li>Onchain stores ciphertext + expiry only.</li>
          <li>Hook checks (userBitmap &amp; ruleMask) == ruleMask and allows/blocks swaps.</li>
          <li>Only pass/fail + reason code is revealed (no attributes).</li>
        </ol>
      </div>
    </div>
  );
}
