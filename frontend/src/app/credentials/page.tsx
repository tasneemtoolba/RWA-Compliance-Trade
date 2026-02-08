"use client";

import { useAccount, useChainId, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import userRegistryAbi from "@/lib/abi/UserRegistry.json";
import Link from "next/link";

export default function CredentialsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const cfg = CONTRACTS.sepolia;
  const isSepolia = chainId === 11155111;

  const { data: profile } = useReadContract({
    address: cfg.userRegistry as `0x${string}`,
    abi: userRegistryAbi,
    functionName: "getEncryptedProfile",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isSepolia },
  });

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Credentials</h1>
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600">Connect wallet to view credentials</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Credentials</h1>
        <p className="mt-2 text-slate-600">Detailed credential information</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {profile ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-600">Ciphertext</div>
              <div className="mt-1 font-mono text-xs break-all bg-slate-50 p-3 rounded">
                {profile[0]}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Expiry</div>
              <div className="mt-1 font-medium">
                {new Date(Number(profile[1]) * 1000).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Ciphertext Length</div>
              <div className="mt-1 font-medium">{profile[0].length} bytes</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No credential found. <Link href="/verify" className="text-link hover:opacity-80">Get Verified</Link>
          </div>
        )}
      </div>
    </div>
  );
}
