"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { useMode } from "@/hooks/useMode";
import { resolveENS, readEnsText, writeEnsText, ENS_KEYS } from "@/lib/ens";
import { formatAddress } from "@/lib/helper";
import { CONTRACTS, reasonText } from "@/lib/contracts";
import userRegistryAbi from "@/lib/abi/UserRegistry.json";
import hookAbi from "@/lib/abi/ComplianceHook.json";
import Link from "next/link";
import Image from "next/image";
import { Copy, ExternalLink, CheckCircle2, Clock, XCircle, Settings, Loader2 } from "lucide-react";
import { HookAuditTable } from "@/components/HookAuditTable";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mode, setMode } = useMode();
  const [userENS, setUserENS] = useState<string | null>(null);
  const [issuerENS, setIssuerENS] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ENS Preferences state
  const [showENSName, setShowENSName] = useState(false);
  const [preferredChain, setPreferredChain] = useState("base");
  const [preferredToken, setPreferredToken] = useState("USDC");
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const cfg = CONTRACTS.sepolia;
  const isSepolia = chainId === 11155111;

  // Read profile from UserRegistry
  const { data: profile } = useReadContract({
    address: cfg.userRegistry as `0x${string}`,
    abi: userRegistryAbi,
    functionName: "getEncryptedProfile",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isSepolia },
  });

  // Read eligibility status
  const { data: eligibilityData } = useReadContract({
    address: cfg.complianceHook as `0x${string}`,
    abi: hookAbi,
    functionName: "check",
    args: [address ?? "0x0000000000000000000000000000000000000000", cfg.poolId],
    query: { enabled: Boolean(address) && isSepolia },
  });

  useEffect(() => {
    if (address) {
      resolveENS(address, mode).then(setUserENS);
    }
  }, [address, mode]);

  // Load ENS preferences
  useEffect(() => {
    if (userENS && isConnected) {
      setIsLoadingPrefs(true);
      Promise.all([
        readEnsText(userENS, ENS_KEYS.DISPLAY_NAME, mode),
        readEnsText(userENS, ENS_KEYS.PREFERRED_CHAIN, mode),
        readEnsText(userENS, ENS_KEYS.PREFERRED_TOKEN, mode),
      ]).then(([displayName, chain, token]) => {
        if (displayName === "true") setShowENSName(true);
        if (chain) setPreferredChain(chain);
        if (token) setPreferredToken(token);
        setIsLoadingPrefs(false);
      }).catch(() => setIsLoadingPrefs(false));
    }
  }, [userENS, isConnected, mode]);

  const handleSavePreferences = async () => {
    if (!userENS || !isConnected) return;

    setIsSavingPrefs(true);
    try {
      // In production, you'd use wagmi's useWriteContract with ENS resolver
      // For demo, we'll simulate the write
      await Promise.all([
        writeEnsText(userENS, ENS_KEYS.DISPLAY_NAME, showENSName ? "true" : "false", mode),
        writeEnsText(userENS, ENS_KEYS.PREFERRED_CHAIN, preferredChain, mode),
        writeEnsText(userENS, ENS_KEYS.PREFERRED_TOKEN, preferredToken, mode),
      ]);
      setIsSavingPrefs(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setIsSavingPrefs(false);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCredentialStatus = () => {
    if (!profile) return { status: "missing", message: "Not verified" };
    const [ciphertext, expiry] = profile;
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = Number(expiry);

    if (ciphertext.length === 0) {
      return { status: "missing", message: "Not verified" };
    }
    if (expiryTime < now) {
      return { status: "expired", message: "Expired", expiry: new Date(expiryTime * 1000) };
    }
    return { status: "verified", message: "Verified", expiry: new Date(expiryTime * 1000) };
  };

  const credentialStatus = getCredentialStatus();
  const [eligible, reasonCode] = eligibilityData as [boolean, number] || [null, null];

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-2 text-slate-600">
            Your wallet is your identity. Your eligibility is private (ciphertext onchain).
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600">Connect wallet to view profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-2 text-slate-600">
            Your wallet is your identity. Your eligibility is private (ciphertext onchain).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {mode === "demo" ? "Demo (Sepolia)" : "Production (Mainnet)"}
          </span>
        </div>
      </div>

      {!isSepolia && mode === "demo" && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Switch to Sepolia to trade in Demo mode
        </div>
      )}

      {/* Card A: Identity */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Identity</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {userENS ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200">
                    <Image
                      src="/profile.png"
                      alt={userENS}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-brand flex items-center justify-center text-white text-2xl font-bold">
                    {address?.[2]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs">+</span>
                </div>
              </div>
              <div className="flex-1">
                {userENS ? (
                  <div className="text-2xl font-semibold">{userENS}</div>
                ) : (
                  <div className="text-sm text-slate-500">
                    <Link href="https://app.ens.domains" target="_blank" className="text-link hover:opacity-80">
                      Get ENS (optional)
                    </Link>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-600 font-mono">{formatAddress(address || "0x")}</span>
                  <span className="text-slate-400">👁</span>
                  <span className="text-slate-400">1</span>
                  <span className="text-slate-400">...</span>
                  <button
                    onClick={copyAddress}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded"></div>
                  </div>
                  <span className="text-sm text-slate-600">Demo (Sepolia)</span>
                  <button className="ml-auto text-xs text-link hover:opacity-80">Set Reverse ENS</button>
                  <button className="text-xs text-slate-400 hover:text-slate-600">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-100">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-600">Primary network</div>
              <div className="font-medium">{mode === "demo" ? "Sepolia" : "Mainnet"}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-2">Issuer</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                </div>
                <span className="font-medium">{issuerENS || "atlas-verifier.eth"}</span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <span>10-GNASI</span>
                <button className="text-slate-400 hover:text-slate-600">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ENS Preferences Section */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold">Your ENS preferences</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-700">Preferred chain</span>
                <span className="text-secondary-brand">▶</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-secondary-brand"></div>
                <span className="font-medium text-secondary-brand">Base</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-700">Show my ENS name</span>
                <span className="text-secondary-brand">▶</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🔒</span>
                <span className="text-slate-400 font-mono">.........</span>
                <span className="text-secondary-brand">▶</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
              <span className="text-slate-700">Advanced</span>
              <span className="text-purple-600">▶</span>
            </div>
          </div>
          {userENS && (
            <button
              onClick={handleSavePreferences}
              disabled={isSavingPrefs || isLoadingPrefs}
              className="mt-4 rounded-xl btn-primary px-4 py-2 text-sm font-medium transition"
            >
              {isSavingPrefs ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences to ENS"
              )}
            </button>
          )}
          {!userENS && (
            <div className="mt-4 text-xs text-slate-500">
              Get an ENS name to store preferences
            </div>
          )}
        </div>
      </div>

      {/* Card B: Credential Status */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Credential Status</h2>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 ${credentialStatus.status === "verified" ? "bg-green-50 border border-green-200" :
              credentialStatus.status === "expired" ? "bg-yellow-50 border border-yellow-200" :
                "bg-slate-50 border border-slate-200"
            }`}>
            <div className="flex items-center gap-3">
              {credentialStatus.status === "verified" && <CheckCircle2 className="w-6 h-6 text-green-600" />}
              {credentialStatus.status === "expired" && <Clock className="w-6 h-6 text-yellow-600" />}
              {credentialStatus.status === "missing" && <XCircle className="w-6 h-6 text-slate-400" />}
              <div>
                <div className="font-semibold text-lg">
                  {credentialStatus.status === "verified" && "✅ Verified"}
                  {credentialStatus.status === "expired" && "⏰ Expired"}
                  {credentialStatus.status === "missing" && "❌ Not verified"}
                </div>
                {credentialStatus.expiry && (
                  <div className="text-sm text-slate-600 mt-1">
                    Active until: {credentialStatus.expiry.toLocaleDateString()}, {credentialStatus.expiry.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/verify"
              className="rounded-xl btn-primary px-4 py-2 font-medium transition"
            >
              Get Verified
            </Link>
            {credentialStatus.status === "verified" && (
              <button className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50">
                Revoke credential
              </button>
            )}
          </div>

          <div className="text-sm text-slate-600">
            <Link href="/credentials" className="text-link hover:opacity-80">
              View details →
            </Link>
          </div>

          {/* Rule Summary */}
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="font-medium text-slate-700">Rule summary:</div>
            <ul className="space-y-1 text-slate-600">
              <li>• Accredited investor: required</li>
              <li>• Region: EU</li>
              <li>• Max trade bucket: 1,000 USDC</li>
              <li>• Expiry: 30 days</li>
            </ul>
          </div>

          {/* Advanced Accordion */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-left text-sm text-slate-600 hover:text-slate-900 flex items-center justify-between"
          >
            <span>Advanced</span>
            <span>{showAdvanced ? "▼" : "▶"}</span>
          </button>
          {showAdvanced && profile && (
            <div className="mt-2 p-4 bg-slate-50 rounded-xl space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-600">Ciphertext hash: </span>
                <span className="text-slate-900">{profile[0].slice(0, 20)}...</span>
              </div>
              <div>
                <span className="text-slate-600">Pool ruleMask: </span>
                <span className="text-slate-900">2009</span>
              </div>
              <div>
                <span className="text-slate-600">Last reason code: </span>
                <span className="text-slate-900">{reasonCode !== null ? reasonCode : "-"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card C: Recent Hook Checks */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Hook Audit</h2>
        <HookAuditTable />
      </div>

      {/* Card D: Funding & Deposits */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Funding & Deposits</h2>
        <div className="space-y-3">
          {/* Hook Audit for Deposits */}
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-slate-700">Deposited: Base ETH → Ethereum USDC</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 ml-6">1,2 min</div>
          </div>
          <Link
            href="/deposit"
            className="inline-block rounded-xl gradient-cta px-4 py-2 text-white font-medium hover:opacity-90 transition"
          >
            Deposit from any chain →
          </Link>
        </div>
      </div>
    </div>
  );
}
