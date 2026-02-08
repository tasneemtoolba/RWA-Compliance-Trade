"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { isDemoMode } from "@/lib/demoMode";
import { encodeEligibilityToBitmap, encryptBitmap } from "@/lib/mock/fhe";
import { buildBitmap, type Region, type Bucket } from "@/lib/bitmap";
import { bitmapToBytes32 } from "@/lib/encrypt";
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
import { DemoBanner } from "@/components/DemoBanner";

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const isDemo = isDemoMode();

  // Form state
  const [region, setRegion] = useState<Region>("EU");
  const [accredited, setAccredited] = useState(true);
  const [bucket, setBucket] = useState<Bucket>("1000");
  const [expiryDays, setExpiryDays] = useState(30);
  
  // Status state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<{ ciphertext: string; expiry: number } | null>(null);
  const [hookCheckResult, setHookCheckResult] = useState<{ allowed: boolean; reason: string } | null>(null);

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
        // Set default rule mask
        const mask = defaultRuleMask().toString(16).padStart(64, "0");
        poolService.setPoolRule(poolId, `0x${mask}`);
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
        // Use mock FHE encoding
        bitmap = encodeEligibilityToBitmap({ region, accredited, bucket });
        encryptedProfileBitMap = encryptBitmap(bitmap);
      } else {
        // Use real bitmap builder
        bitmap = buildBitmap({ accredited, region, bucket });
        encryptedProfileBitMap = bitmapToBytes32(bitmap);
      }
      
      // Calculate expiry
      const expiry = Math.floor(Date.now() / 1000) + expiryDays * 86400;

      setSaveStatus("Saving ciphertext + expiry onchain...");

      // Check if user is already registered
      const userId = registryService.getUserIdByWallet(address);
      const isRegistered = userId !== "0x0" && userId.length > 2;
      
      // Call selfRegister or selfUpdateProfile
      const hash = isRegistered
        ? await registryService.selfUpdateProfile(address, encryptedProfileBitMap, expiry)
        : await registryService.selfRegister(address, encryptedProfileBitMap, expiry);

      setTxHash(hash);
      setSaveStatus("✅ Profile saved!");
      
      // Update saved profile state
      setSavedProfile({
        ciphertext: encryptedProfileBitMap.slice(0, 20) + "...",
        expiry,
      });

      // Run hook check
      setTimeout(async () => {
        try {
          const poolId = CONTRACTS.sepolia.poolId;
          const check = await hookService.checkUserCompliance(address, poolId);
          setHookCheckResult({
            allowed: check.allowed,
            reason: check.reason,
          });
        } catch (e) {
          console.error("Hook check error:", e);
        }
      }, 500);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setSaveStatus(`Error: ${error.message || "Failed to save profile"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Get Verified</h1>
          <p className="mt-2 text-slate-600">
            Encrypt eligibility locally → store ciphertext (simulated) → hook checks pass/fail only.
          </p>
        </div>
        <DemoBanner />
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

      <DemoBanner />

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
                {txHash && (
                  <div className="mt-2">
                    <div className="text-xs font-mono text-green-700">Tx: {txHash.slice(0, 20)}...</div>
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
              <div className={`rounded-xl border p-4 ${
                hookCheckResult.allowed 
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

            <div>
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

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {saveStatus}
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
