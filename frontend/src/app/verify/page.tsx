"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, reasonText } from "@/lib/contracts";
import hookAbi from "@/lib/abi/ComplianceHook.json";
import { defaultRuleMask } from "@/lib/bitmap";

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const cfg = CONTRACTS.sepolia;
  const isSepolia = chainId === 11155111;

  const [eligible, setEligible] = useState<boolean | null>(null);
  const [reason, setReason] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      <div>
        <h1 className="text-3xl font-semibold">Get Verified</h1>
        <p className="mt-2 text-slate-600">
          MVP shows eligibility check (trade UI comes next).
        </p>
      </div>

      {/* Hook Check Card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Hook Check</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={cfg.poolId.slice(0, 10) + "..." + cfg.poolId.slice(-8)}
              className="px-3 py-1.5 text-sm rounded-xl border bg-slate-50 text-slate-600 w-48"
            />
            <button className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {eligible === true ? (
              <>
                <span className="text-green-600 text-xl">✅</span>
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
              <div className="text-sm text-slate-600">Reason</div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="radio"
                  checked={true}
                  readOnly
                  className="text-primary-brand"
                />
                <span className="text-sm font-medium">{reason !== null ? reasonText[reason] : "OK"}</span>
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

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900"
          >
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>Advanced</span>
            </div>
            <span>{showAdvanced ? "▼" : "▶"}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-2 text-sm text-slate-600 p-3 bg-slate-50 rounded">
              <div className="flex items-center justify-between">
                <span>Default pool rule mask:</span>
                <select className="rounded border px-2 py-1 text-xs">
                  <option>2009</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tip Card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold">Tip</h3>
        </div>
        <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
          <li>User enters an eligible profile.</li>
          <li>Create a second wallet with a non-eligible profile.</li>
          <li>On Trade page, run the hook check on both.</li>
        </ol>
      </div>
    </div>
  );
}
