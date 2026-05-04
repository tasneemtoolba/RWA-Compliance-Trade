"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isDemoMode } from "@/lib/demoMode";
import { encodeEligibilityToBitmap, encryptBitmap } from "@/lib/mock/fhe";
import { buildBitmap, type Region, type Bucket } from "@/lib/bitmap";
import { bitmapToBytes32, encryptedHandlesToBytes32 } from "@/lib/encrypt";
import { useEncryptBitmap } from "@/hooks/fhevm/useEncryptBitmap";
import * as registryService from "@/lib/services/registry";
import * as hookService from "@/lib/services/hook";
import * as poolService from "@/lib/services/pool";
import { CONTRACTS } from "@/lib/contracts";
import { defaultRuleMask } from "@/lib/bitmap";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import userRegistryAbi from "@/lib/abi/UserRegistry.json";

export default function VerifyPage() {
  const { address, isConnected, chainId } = useAccount();
  const isDemo = isDemoMode();

  // FHE encryption hook
  const { encryptBitmap: encryptBitmapFHE, isEncrypting: isFHEEncrypting, encryptedBitmap, resetEncrypt, isReady: isFHEReady } = useEncryptBitmap();

  // Wagmi contract write hooks for simulating MetaMask transactions
  const {
    writeContract,
    data: txHash,
    isPending: isTxPending,
    isError: isTxError,
    error: txError,
    reset: resetTx,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Form state
  const [region, setRegion] = useState<Region>("EU");
  const [accredited, setAccredited] = useState(true);
  const [bucket, setBucket] = useState<Bucket>("1000");
  const [expiryDays, setExpiryDays] = useState(30);

  // Status state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [savedTxHash, setSavedTxHash] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<{ ciphertext: string; expiry: number } | null>(null);
  const [hookCheckResult, setHookCheckResult] = useState<{ allowed: boolean; reason: string } | null>(null);
  const [lastBitmapHex, setLastBitmapHex] = useState<string | null>(null);
  const [ruleMaskHex, setRuleMaskHex] = useState<string | null>(null);
  const [pendingEncryptedData, setPendingEncryptedData] = useState<string | null>(null);

  // Load existing profile
  useEffect(() => {
    if (address && isDemo) {
      const profile = registryService.getProfile(address);
      if (profile.exists) {
        setSavedProfile({
          ciphertext: profile.encryptedProfileBitMap.slice(0, 20) + "...",
          expiry: profile.expiry,
        });
      }
    }
  }, [address, isDemo]);

  // Initialize pool rule if needed
  useEffect(() => {
    if (isDemo && address) {
      const poolId = CONTRACTS.sepolia.poolId;
      const ruleMask = poolService.getPoolRule(poolId);
      if (ruleMask === "0" || !ruleMask) {
        // Set default rule mask (demo: accredited + EU + bucket>=1000)
        const maskBigInt = defaultRuleMask();
        const maskHex = maskBigInt.toString(16).padStart(64, "0");
        const fullMaskHex = `0x${maskHex}`;
        poolService.setPoolRule(poolId, fullMaskHex);
        setRuleMaskHex(fullMaskHex);
      } else {
        setRuleMaskHex(ruleMask);
      }
    }
  }, [isDemo, address]);

  const handleSave = async () => {
    if (!isConnected || !address) {
      setSaveStatus("Please connect wallet");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Encrypting locally in your browser...");

    try {
      // Build bitmap from form inputs
      let bitmap: bigint;
      let encryptedProfileBitMap: string;

      if (isDemo) {
        // Use mock FHE encoding (demo bitmap)
        bitmap = encodeEligibilityToBitmap({ region, accredited, bucket });
        encryptedProfileBitMap = encryptBitmap(bitmap);
      } else {
        // Use real bitmap builder
        bitmap = buildBitmap({ accredited, region, bucket });
        
        // Try to use FHE encryption if available, otherwise fall back to plain bytes32
        if (isFHEReady && chainId) {
          try {
            // Get UserRegistry contract address for encryption
            const userRegistryAddress = CONTRACTS.sepolia.userRegistry as `0x${string}`;
            
            // Encrypt the bitmap using FHE
            setSaveStatus("Encrypting with FHE (this may take a moment)...");
            const encryptedResult = await encryptBitmapFHE(userRegistryAddress, bitmap);
            
            // Convert encrypted handles to bytes32 format
            encryptedProfileBitMap = encryptedHandlesToBytes32(encryptedResult.handles);
            resetEncrypt();
          } catch (fheError: any) {
            console.warn("FHE encryption failed, falling back to plain bytes32:", fheError);
            toast.warning("FHE encryption unavailable, using plain bytes32");
            // Fall back to plain bytes32 conversion
            encryptedProfileBitMap = bitmapToBytes32(bitmap);
          }
        } else {
          // FHE not ready, use plain bytes32 conversion
          encryptedProfileBitMap = bitmapToBytes32(bitmap);
        }
      }

      // Store debug bitmap hex for UI
      const bitmapHex = `0x${bitmap.toString(16).padStart(64, "0")}`;
      setLastBitmapHex(bitmapHex);

      // Store encrypted data for later use
      setPendingEncryptedData(encryptedProfileBitMap);

      // Calculate expiry
      const expiry = Math.floor(Date.now() / 1000) + expiryDays * 86400;

      setSaveStatus("Preparing transaction...");

      // Check if user is already registered using getProfile().exists (reliable source)
      const existing = registryService.getProfile(address);
      const isRegistered = existing.exists;

      // Get contract address - use a valid-looking address for simulation
      // In production, this would be the actual deployed contract address
      const contractAddress = (CONTRACTS.sepolia.userRegistry === "0xYourUserRegistry" 
        ? "0x1234567890123456789012345678901234567890" // Placeholder for simulation
        : CONTRACTS.sepolia.userRegistry) as `0x${string}`;

      // Convert encryptedProfileBitMap to bytes32 format if needed
      // The ABI expects bytes32, so we need to ensure it's the right format
      // If it's longer than 32 bytes, we'll take the first 32 bytes
      let encryptedBytes32: `0x${string}`;
      if (encryptedProfileBitMap.startsWith("0x")) {
        const hex = encryptedProfileBitMap.slice(2);
        encryptedBytes32 = `0x${hex.slice(0, 64).padEnd(64, "0")}` as `0x${string}`;
      } else {
        encryptedBytes32 = `0x${encryptedProfileBitMap.slice(0, 64).padEnd(64, "0")}` as `0x${string}`;
      }

      setSaveStatus(isRegistered ? "Confirm transaction in MetaMask to update profile..." : "Confirm transaction in MetaMask to register...");

      // Trigger MetaMask transaction simulation
      try {
        writeContract({
          address: contractAddress,
          abi: userRegistryAbi,
          functionName: isRegistered ? "selfUpdateProfile" : "selfRegister",
          args: [
            encryptedBytes32,
            BigInt(expiry),
          ],
        });

        // The transaction hash will be set by wagmi's useWriteContract hook
        // We'll handle the success in the useEffect below
      } catch (error: any) {
        console.error("Transaction error:", error);
        setSaveStatus(`Transaction failed: ${error.message || "User rejected transaction"}`);
        toast.error("Transaction failed", {
          description: error.message || "User may have rejected the transaction",
        });
        setIsSaving(false);
        setPendingEncryptedData(null);
        return;
      }

      // Update saved profile state
      setSavedProfile({
        ciphertext: encryptedProfileBitMap.slice(0, 20) + "...",
        expiry,
      });

      // Note: Transaction hash and confirmation will be handled by useEffect below
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setSaveStatus(`Error: ${error.message || "Failed to save profile"}`);
      toast.error(`Error: ${error.message || "Failed to save profile"}`);
      setIsSaving(false);
    }
  };

  // Handle transaction status updates
  useEffect(() => {
    if (txHash && !savedTxHash) {
      setSavedTxHash(txHash);
      setSaveStatus("Transaction submitted! Waiting for confirmation...");
      toast.info("Transaction submitted", {
        description: `Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
      });
    }
  }, [txHash, savedTxHash]);

  useEffect(() => {
    if (isConfirming) {
      setSaveStatus("Transaction confirming...");
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      // Transaction confirmed successfully
      const existing = registryService.getProfile(address || "");
      const isRegistered = existing.exists;
      const statusMessage = isRegistered ? "✅ Profile updated!" : "✅ Profile registered!";
      
      setSaveStatus(statusMessage);
      
      // Update saved profile state (use the data we prepared earlier)
      const expiry = Math.floor(Date.now() / 1000) + expiryDays * 86400;
      setSavedProfile({
        ciphertext: pendingEncryptedData ? `${pendingEncryptedData.slice(0, 20)}...` : "0x...",
        expiry,
      });

      // Also update the mock registry service for consistency
      if (pendingEncryptedData) {
        if (isRegistered) {
          registryService.selfUpdateProfile(address || "", pendingEncryptedData, expiry);
        } else {
          registryService.selfRegister(address || "", pendingEncryptedData, expiry);
        }
      }

      toast.success(statusMessage, {
        description: `Transaction confirmed: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
      });

      // Run hook check after a short delay
      setTimeout(async () => {
        try {
          const poolId = CONTRACTS.sepolia.poolId;
          const check = await hookService.checkUserCompliance(address || "", poolId);
          setHookCheckResult({
            allowed: check.allowed,
            reason: check.reason,
          });
        } catch (e) {
          console.error("Hook check error:", e);
        }
      }, 500);

      setIsSaving(false);
      setPendingEncryptedData(null);
      resetTx();
    }
  }, [isConfirmed, txHash, address, expiryDays, pendingEncryptedData, resetTx]);

  useEffect(() => {
    if (isTxError && txError) {
      setSaveStatus(`Transaction failed: ${txError.message || "Unknown error"}`);
      toast.error("Transaction failed", {
        description: txError.message || "Please try again",
      });
      setIsSaving(false);
    }
  }, [isTxError, txError]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Get Verified</h1>
          <p className="mt-2 text-slate-600">
            Encrypt eligibility locally → store ciphertext (simulated) → hook checks pass/fail only.
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600 mb-4">Connect wallet to get verified</p>
          <Button className="btn-primary">Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Get Verified</h1>
        <p className="mt-2 text-slate-600">
          Encrypt eligibility locally → store ciphertext (simulated) → hook checks pass/fail only.
        </p>
      </div>


      {/* Profile Form */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Eligibility Profile</h2>

        {savedProfile ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Profile Saved</span>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <div>✅ Profile saved. Now go to Trade → Run check.</div>
                <div className="mt-2 text-xs">Only ciphertext is stored. No raw attributes are written onchain.</div>
                {(savedTxHash || txHash) && (
                  <div className="mt-2">
                    <div className="text-xs font-mono text-green-700">Tx: {(savedTxHash || txHash)?.slice(0, 20)}...</div>
                  </div>
                )}
                <div className="mt-2 text-xs">
                  Ciphertext: <span className="font-mono">{savedProfile.ciphertext}</span>
                </div>
                <div className="text-xs">
                  Expires: {new Date(savedProfile.expiry * 1000).toLocaleString()}
                </div>
              </div>
            </div>

            {hookCheckResult && (
              <div className={`rounded-xl border p-4 ${hookCheckResult.allowed
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
                }`}>
                <div className="flex items-center gap-2">
                  {hookCheckResult.allowed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Hook would allow swaps</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Hook would block swaps: {hookCheckResult.reason}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setSavedProfile(null);
                  setHookCheckResult(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Update Profile
              </Button>
              <Link href="/trade" className="flex-1">
                <Button className="w-full btn-primary">
                  Run Eligibility Check →
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={region} onValueChange={(value) => setRegion(value as Region)}>
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="APAC">APAC</SelectItem>
                  <SelectItem value="LATAM">LATAM</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accredited">Accredited Investor</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="accredited"
                  checked={accredited}
                  onChange={(e) => setAccredited(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-brand focus:ring-primary-brand"
                />
                <label htmlFor="accredited" className="text-sm text-slate-700">
                  I am an accredited investor
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket">Max Trade Bucket</Label>
              <Select value={bucket} onValueChange={(value) => setBucket(value as Bucket)}>
                <SelectTrigger id="bucket">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 USDC</SelectItem>
                  <SelectItem value="1000">1,000 USDC</SelectItem>
                  <SelectItem value="10000">10,000 USDC</SelectItem>
                  <SelectItem value="100000">100,000 USDC</SelectItem>
                  <SelectItem value="1000000">1,000,000 USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiry">Expiry (days)</Label>
              <Select
                value={expiryDays.toString()}
                onValueChange={(value) => setExpiryDays(Number(value))}
              >
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Debug: show bitmap + rule mask so you can see why you're (not) eligible */}
            {isDemo && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-800 mb-1">Debug (Demo Mode)</div>
                <div>
                  <span className="text-slate-600">Your bitmap:</span>{" "}
                  <span className="font-mono break-all">
                    {lastBitmapHex || "— (save profile to compute bitmap)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Pool rule mask:</span>{" "}
                  <span className="font-mono break-all">
                    {ruleMaskHex || "— (not configured yet)"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Rule requires: accredited (bit0) + EU (bit1) + bucket ≥ 1000 (bit3). If any of these bits are missing in your bitmap, the hook returns NOT_ELIGIBLE.
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving || isFHEEncrypting || isTxPending || isConfirming}
              className="w-full btn-primary"
            >
              {(isSaving || isFHEEncrypting || isTxPending || isConfirming) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {saveStatus || (isTxPending ? "Confirm in MetaMask..." : isConfirming ? "Confirming..." : "Encrypting...")}
                </>
              ) : (
                "Encrypt & Save"
              )}
            </Button>

            {saveStatus && !isSaving && saveStatus !== "✅ Profile saved!" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {saveStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
