"use client";

import { useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { buildBitmap, Region, Bucket } from "@/lib/bitmap";
import { encryptBitmap } from "@/lib/encrypt";
import userRegistryAbi from "@/lib/abi/UserRegistry.json";
import Link from "next/link";

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const [region, setRegion] = useState<Region>("EU");
  const [bucket, setBucket] = useState<Bucket>("1000");
  const [accredited, setAccredited] = useState(true);
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isSepolia = chainId === 11155111;
  const cfg = CONTRACTS.sepolia;

  const bitmap = buildBitmap({ accredited, region, bucket });

  async function onSave() {
    if (!isConnected || !address) return;
    if (!isSepolia) {
      setStatus("Switch network to Sepolia.");
      return;
    }

    setStatus("Encrypting...");
    const ciphertext = await encryptBitmap(bitmap);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + days * 86400);

    setStatus("Sending tx...");
    try {
      await writeContractAsync({
        address: cfg.userRegistry as `0x${string}`,
        abi: userRegistryAbi,
        functionName: "setMyEncryptedProfile",
        args: [ciphertext, Number(expiry)],
      });
      setStatus("✅ Profile saved. Go to Trade.");
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold">Private Compliance Trading</h1>
        <span className="rounded-full bg-secondary-brand/10 px-3 py-1 text-xs font-medium text-secondary-brand">Demo</span>
      </div>
      <p className="text-slate-600">
        Encrypt your eligibility profile in the browser → store ciphertext onchain → hook allows or blocks swaps.
      </p>

      {/* Two Panel Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Panel: Start here */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Start here</h2>
          <p className="mt-1 text-sm text-slate-600">Pick a few demo attributes.</p>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span>Choose</span>
            <span>→</span>
            <span>Encrypt</span>
            <span>→</span>
            <span>Save</span>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-slate-600">Region</label>
              <select
                className="mt-1 w-full rounded-xl border p-2"
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
              <label className="text-sm text-slate-600">Max trade bucket</label>
              <select
                className="mt-1 w-full rounded-xl border p-2"
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

            <div className="flex items-center gap-3">
              <input
                id="acc"
                type="checkbox"
                checked={accredited}
                onChange={(e) => setAccredited(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="acc" className="text-sm text-slate-700">Accredited investor</label>
              <select
                className="ml-auto rounded-xl border p-2 text-sm"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={!isConnected}
            className="mt-6 w-full rounded-xl btn-primary px-4 py-3 font-medium transition"
          >
            Encrypt & Save
          </button>

          <div className="mt-4 text-sm text-slate-600">
            {status || (!isConnected ? "Connect wallet to continue." : "")}
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-4 text-sm text-primary-brand hover:text-primary-brand flex items-center gap-1"
          >
            Advanced {showAdvanced ? "▼" : "▶"}
          </button>
          {showAdvanced && (
            <div className="mt-2 text-xs text-slate-600 p-3 bg-slate-50 rounded">
              bitmap (uint256): <code className="font-mono">{bitmap.toString()}</code>
            </div>
          )}
        </div>

        {/* Right Panel: Get Verified */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Get Verified</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick a few demo attributes. They will be encrypted in your browser and stored as ciphertext:
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary-brand">
                <span>Onchain</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 ml-6">
                <li>• Ciphertext + expiry</li>
                <li>• Hook decision event</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary-brand">
                <span>Not onchain</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 ml-6">
                <li>• Region, investor type</li>
                <li>• Limits (plaintext)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-xl border p-4 bg-slate-50">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <span>💡</span>
              <span>Tip</span>
            </div>
            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside">
              <li>Create an eligible profile.</li>
              <li>Create a second wallet with a non-eligible profile.</li>
              <li>Go to Trade page, run the hook check on both.</li>
            </ol>
          </div>

          <Link href="/docs" className="mt-4 text-sm text-link hover:opacity-80 inline-flex items-center gap-1">
            Read docs →
          </Link>
        </div>
      </div>
    </div>
  );
}
