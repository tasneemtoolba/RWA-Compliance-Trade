"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract, useEnsName, useEnsText, useEnsAddress, useEnsAvatar } from "wagmi";
import { normalize } from "viem/ens";
import { useMode } from "@/hooks/useMode";
import { formatAddress } from "@/lib/helper";
import { CONTRACTS, reasonText } from "@/lib/contracts";
import { ENS_KEYS } from "@/lib/ens/keys";
import userRegistryAbi from "@/lib/abi/UserRegistry.json";
import hookAbi from "@/lib/abi/ComplianceHook.json";
import Link from "next/link";
import Image from "next/image";
import { Copy, ExternalLink, CheckCircle2, Clock, XCircle, Settings } from "lucide-react";
import { HookAuditTable } from "@/components/HookAuditTable";
import { EnsRecordsEditor } from "@/components/profile/EnsRecordsEditor";
import { EnsIdentity } from "@/components/ens/EnsIdentity";
import { useRouteStore } from "@/lib/store/useRouteStore";
import { CHAIN_NAMES } from "@/lib/lifi/constants";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mode, setMode } = useMode();
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Default issuer ENS name
  const ISSUER_ENS_NAME = "pybast.eth";

  // Use wagmi hooks for ENS resolution
  const { data: userENS } = useEnsName({ address: address || undefined });

  // Resolve issuer ENS name to address and get avatar
  const { data: issuerAddress } = useEnsAddress({
    name: normalize(ISSUER_ENS_NAME),
  });

  const { data: issuerAvatar } = useEnsAvatar({
    name: ISSUER_ENS_NAME,
  });

  // Read issuer ENS text records
  const { data: issuerCredentialRef } = useEnsText({
    name: ISSUER_ENS_NAME,
    key: ENS_KEYS.CREDENTIAL_REF,
  });

  const { data: issuerDefaultAsset } = useEnsText({
    name: ISSUER_ENS_NAME,
    key: ENS_KEYS.DEFAULT_ASSET,
  });

  // Read user ENS text records using wagmi
  const { data: credentialRef } = useEnsText({
    name: userENS || undefined,
    key: ENS_KEYS.CREDENTIAL_REF,
    query: { enabled: Boolean(userENS) },
  });

  const { data: defaultAsset } = useEnsText({
    name: userENS || undefined,
    key: ENS_KEYS.DEFAULT_ASSET,
    query: { enabled: Boolean(userENS) },
  });

  const { data: preferredChain } = useEnsText({
    name: userENS || undefined,
    key: ENS_KEYS.PREFERRED_CHAIN,
    query: { enabled: Boolean(userENS) },
  });

  const { data: preferredToken } = useEnsText({
    name: userENS || undefined,
    key: ENS_KEYS.PREFERRED_TOKEN,
    query: { enabled: Boolean(userENS) },
  });

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


  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCredentialStatus = () => {
    if (!profile) return { status: "missing", message: "Not verified" };
    const profileData = profile as [string, bigint] | undefined;
    if (!profileData) return { status: "missing", message: "Not verified" };
    const [ciphertext, expiry] = profileData;
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

  // Get last deposit route from store
  const { lastRoute } = useRouteStore();

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
              {address ? (
                <>
                  <EnsIdentity address={address} showAddress={true} size="lg" />
                  <div className="flex-1">
                    {!userENS && (
                      <div className="text-sm text-slate-500 mb-2">
                        <div className="mb-2">No ENS name detected for this wallet. That's okay — you can still trade.</div>
                        <Link href="https://app.ens.domains" target="_blank" className="text-link hover:opacity-80">
                          Get ENS (optional)
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={copyAddress}
                        className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-xs text-slate-500">Copy address</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded"></div>
                      </div>
                      <span className="text-sm text-slate-600">{mode === "demo" ? "Demo (Sepolia)" : "Production (Mainnet)"}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500">Connect wallet to view identity</div>
              )}
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
                {issuerAvatar ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                    <Image
                      src={issuerAvatar}
                      alt={ISSUER_ENS_NAME}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-brand flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {ISSUER_ENS_NAME[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium">{ISSUER_ENS_NAME}</span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              {issuerAddress && (
                <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="font-mono">{formatAddress(issuerAddress)}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(issuerAddress);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {(issuerCredentialRef || issuerDefaultAsset) && (
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  {issuerCredentialRef && (
                    <div>Credential: {issuerCredentialRef.slice(0, 20)}...</div>
                  )}
                  {issuerDefaultAsset && (
                    <div>Default Asset: {issuerDefaultAsset}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ENS Preferences Section */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold">ENS Text Records (Portable Preferences)</h3>
          </div>

          {/* Display read records */}
          {(credentialRef || defaultAsset || preferredChain || preferredToken) && (
            <div className="mb-4 space-y-2 text-sm">
              {credentialRef && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Credential Ref:</span>
                  <span className="font-mono text-xs">{credentialRef}</span>
                </div>
              )}
              {defaultAsset && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Default Asset:</span>
                  <span className="font-medium">{defaultAsset}</span>
                </div>
              )}
              {preferredChain && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Preferred Chain:</span>
                  <span className="font-medium">{preferredChain}</span>
                </div>
              )}
              {preferredToken && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Preferred Token:</span>
                  <span className="font-medium">{preferredToken}</span>
                </div>
              )}
            </div>
          )}

          {/* ENS Records Editor */}
          <EnsRecordsEditor ensName={userENS || null} />
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
          {showAdvanced && profile ? (
            <div className="mt-2 p-4 bg-slate-50 rounded-xl space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-600">Ciphertext hash: </span>
                <span className="text-slate-900">
                  {(() => {
                    const profileData = profile as [string, bigint] | undefined;
                    return profileData?.[0]?.slice(0, 20) || "N/A";
                  })()}...
                </span>
              </div>
              <div>
                <span className="text-slate-600">Pool ruleMask: </span>
                <span className="text-slate-900">2009</span>
              </div>
              <div>
                <span className="text-slate-600">Last reason code: </span>
                <span className="text-slate-900">{reasonCode !== null ? String(reasonCode) : "-"}</span>
              </div>
            </div>
          ) : null}
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
          {lastRoute ? (
            <>
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Last Deposit Route</span>
                </div>
                <div className="text-sm text-slate-700 mb-2">
                  {CHAIN_NAMES[lastRoute.route.fromChainId]} → {CHAIN_NAMES[lastRoute.route.toChainId]}
                </div>
                {lastRoute.receivedAmount && (
                  <div className="text-xs text-slate-600 mb-2">
                    Received: {parseFloat(lastRoute.receivedAmount).toFixed(6)} {lastRoute.route.toToken.symbol}
                  </div>
                )}
                {lastRoute.stepReceipts.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {lastRoute.stepReceipts.map((receipt, index) => (
                      <a
                        key={receipt.stepId}
                        href={`https://${mode === "demo" ? "sepolia." : ""}etherscan.io/tx/${receipt.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-link hover:opacity-80"
                      >
                        Step {index + 1} tx
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
              No deposit history yet
            </div>
          )}
          <Link
            href="/deposit"
            className="inline-block rounded-xl btn-primary px-4 py-2 text-white font-medium hover:opacity-90 transition"
          >
            Deposit from any chain →
          </Link>
        </div>
      </div>
    </div>
  );
}
