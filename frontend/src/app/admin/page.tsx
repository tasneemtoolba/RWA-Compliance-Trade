"use client";

import { useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { useMode } from "@/hooks/useMode";
import { CONTRACTS } from "@/lib/contracts";
import { defaultRuleMask } from "@/lib/bitmap";
import hookAbi from "@/lib/abi/ComplianceHook.json";
import userRegistryAbi from "@/lib/abi/UserRegistry.json";
import { buildBitmap, Region, Bucket } from "@/lib/bitmap";
import { encryptBitmap } from "@/lib/encrypt";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mode } = useMode();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<string>("");
  const [poolId, setPoolId] = useState(CONTRACTS.sepolia.poolId);
  const [ruleMask, setRuleMask] = useState(defaultRuleMask().toString());

  // For issuing credentials
  const [targetUser, setTargetUser] = useState("");
  const [region, setRegion] = useState<Region>("EU");
  const [bucket, setBucket] = useState<Bucket>("1000");
  const [accredited, setAccredited] = useState(true);
  const [days, setDays] = useState(30);

  const cfg = CONTRACTS.sepolia;
  const isSepolia = chainId === 11155111;

  const handleSetPoolRule = async () => {
    if (!isConnected || !isSepolia) {
      setStatus("Connect wallet and switch to Sepolia");
      return;
    }

    setStatus("Setting pool rule mask...");
    try {
      await writeContractAsync({
        address: cfg.complianceHook as `0x${string}`,
        abi: hookAbi,
        functionName: "setPoolRuleMask",
        args: [poolId as `0x${string}`, BigInt(ruleMask)],
      });
      setStatus("✅ Pool rule mask set successfully");
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleIssueCredential = async () => {
    if (!isConnected || !isSepolia || !targetUser) {
      setStatus("Fill all fields and connect wallet");
      return;
    }

    setStatus("Issuing credential...");
    try {
      const bitmap = buildBitmap({ accredited, region, bucket });
      const ciphertext = await encryptBitmap(bitmap);
      const expiry = BigInt(Math.floor(Date.now() / 1000) + days * 86400);

      await writeContractAsync({
        address: cfg.userRegistry as `0x${string}`,
        abi: userRegistryAbi,
        functionName: "setEncryptedProfileFor",
        args: [targetUser as `0x${string}`, ciphertext, Number(expiry)],
      });
      setStatus("✅ Credential issued successfully");
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600">Connect wallet to access admin functions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="mt-2 text-slate-600">Owner-only functions for pool configuration and credential issuance</p>
      </div>

      {/* Set Pool Rule Mask */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Set Pool Rule Mask</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 block mb-2">Pool ID (bytes32)</label>
            <input
              type="text"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              className="w-full rounded-xl border p-2 font-mono text-sm"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-2">Rule Mask (uint256)</label>
            <input
              type="text"
              value={ruleMask}
              onChange={(e) => setRuleMask(e.target.value)}
              className="w-full rounded-xl border p-2 font-mono text-sm"
              placeholder="2009"
            />
            <div className="mt-2 text-xs text-slate-500">
              Default: {defaultRuleMask().toString()} (accredited + EU + bucket=1k)
            </div>
          </div>
          <button
            onClick={handleSetPoolRule}
            disabled={!isSepolia}
            className="rounded-xl btn-primary px-4 py-2 font-medium transition"
          >
            Set Pool Rule Mask
          </button>
        </div>
      </div>

      {/* Issue Credential */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Issue Credential</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 block mb-2">Target User Address</label>
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              className="w-full rounded-xl border p-2 font-mono text-sm"
              placeholder="0x..."
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 block mb-2">Region</label>
              <select
                className="w-full rounded-xl border p-2"
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
              >
                <option value="EU">EU</option>
                <option value="US">US</option>
                <option value="APAC">APAC</option>
                <option value="LATAM">LATAM</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-2">Max Bucket</label>
              <select
                className="w-full rounded-xl border p-2"
                value={bucket}
                onChange={(e) => setBucket(e.target.value as Bucket)}
              >
                <option value="100">100 USDC</option>
                <option value="1000">1,000 USDC</option>
                <option value="10000">10,000 USDC</option>
                <option value="100000">100,000 USDC</option>
                <option value="1000000">1,000,000 USDC</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="adminAccredited"
                checked={accredited}
                onChange={(e) => setAccredited(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="adminAccredited" className="text-sm text-slate-700">Accredited investor</label>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-2">Expiry (days)</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full rounded-xl border p-2"
              />
            </div>
          </div>
          <button
            onClick={handleIssueCredential}
            disabled={!isSepolia || !targetUser}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-white font-medium disabled:opacity-50 hover:from-purple-700 hover:to-purple-800 transition"
          >
            Issue Credential
          </button>
        </div>
      </div>

      {status && (
        <div className={`rounded-xl border p-4 ${status.startsWith("✅") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}>
          <div className="flex items-center gap-2">
            {status.startsWith("✅") ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={status.startsWith("✅") ? "text-green-800" : "text-red-800"}>
              {status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
