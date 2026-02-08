# Get Verified + Trade Flow Fix

## Summary

Fixed the "Get Verified" and "Trade" flow to allow users to self-register and update their profiles, with proper eligibility checking.

## Contract Status

**Contracts already support self-service registration:**
- `UserRegistry.setMyEncryptedProfile()` is **public** (not `onlyOwner`)
- `FHEVerifier.verify()` already implements bitmap check: `(userBitmap & ruleMask) == ruleMask`
- `ComplianceHook.check()` already provides view function for eligibility checking

## Frontend Changes

### 1. Verify Page (`app/verify/page.tsx`)

**Added:**
- Full profile creation form with:
  - Region selector (EU/US/APAC/LATAM/Other)
  - Accredited investor checkbox
  - Max trade bucket selector (100/1K/10K/100K/1M USDC)
  - Expiry days selector (7/30/60/90)
- Profile encryption flow:
  - Builds bitmap from form inputs
  - Encrypts bitmap (demo: `abi.encode(uint256)`, production: real FHE)
  - Calls `setMyEncryptedProfile(ciphertext, expiry)`
- Success state showing:
  - Profile saved message
  - Transaction hash link
  - Ciphertext preview
  - Expiry timestamp
  - CTA to "Run Eligibility Check"
- Eligibility preview after save
- Network and wallet connection checks

**User Flow:**
1. Connect wallet → Switch to Sepolia
2. Fill form (region, accredited, bucket, expiry)
3. Click "Encrypt & Save" → Shows "Encrypting locally..." → "Saving ciphertext onchain..."
4. On success → Shows profile details + eligibility preview
5. Click "Run Eligibility Check" → Goes to Trade page

### 2. Trade Page (`app/trade/page.tsx`)

**Updated:**
- Better eligibility messaging:
  - Eligible: "Hook would allow swaps for this pool"
  - Not eligible: "Hook would block swaps: rule mismatch" + reason code
- Swap button state:
  - Enabled when `eligible === true`
  - Disabled with helper text when not eligible
- Clear error messages for:
  - No profile (Reason: NO_CREDENTIAL) → CTA to Get Verified
  - Expired profile (Reason: EXPIRED)
  - Not eligible (Reason: NOT_ELIGIBLE)
  - Pool not configured (Reason: POOL_NOT_CONFIGURED)

## How It Works

### Profile Creation
1. User fills form → builds bitmap (e.g., `accredited | EU | bucket1000`)
2. Browser encrypts bitmap → `abi.encode(uint256 bitmap)` for demo
3. Calls `UserRegistry.setMyEncryptedProfile(ciphertext, expiry)`
4. Onchain stores: `ciphertext` (bytes) + `expiry` (uint64)
5. No raw attributes stored onchain

### Eligibility Check
1. User clicks "Run check" on Trade page
2. Calls `ComplianceHook.check(user, poolId)`
3. Hook:
   - Fetches `ciphertext` + `expiry` from registry
   - Checks expiry valid
   - Calls `FHEVerifier.verify(ciphertext, ruleMask)`
   - Verifier decodes bitmap and checks: `(userBitmap & ruleMask) == ruleMask`
4. Returns: `(eligible: bool, reasonCode: uint8)`
5. UI shows pass/fail + reason

### Demo Flow
1. **Wallet A**: Get Verified → EU + Accredited + 1K bucket → Save → Run check → Eligible
2. **Wallet B**: Get Verified → US + Not Accredited + 100 bucket → Save → Run check → Not Eligible
3. Hook blocks Wallet B swaps, allows Wallet A swaps
4. Only pass/fail revealed, no attributes exposed

## UI Copy

### Verify Page
- Header: "Create a private eligibility profile. We store ciphertext onchain; trades reveal only pass/fail."
- Tip box: 3-step process
- Success: "Saved encrypted profile. Only ciphertext is stored. No raw attributes are written onchain."

### Trade Page
- Eligible: "Hook would allow swaps for this pool."
- Not eligible: "Hook would block swaps: rule mismatch (Reason: NOT_ELIGIBLE)."
- No profile: "Hook would block swaps: rule mismatch (Reason: NO_CREDENTIAL)." + CTA to Get Verified

## Next Steps

1. **Deploy contracts to Sepolia** (if not already deployed)
2. **Set pool rule mask** (owner calls `ComplianceHook.setPoolRuleMask(poolId, ruleMask)`)
3. **Test flow:**
   - Create eligible profile → Run check → Should pass
   - Create ineligible profile → Run check → Should fail
4. **Wire actual swap** (when ready) - hook will enforce in `beforeSwap`

## Files Changed

- `frontend/src/app/verify/page.tsx` - Complete rewrite with form
- `frontend/src/app/trade/page.tsx` - Better eligibility messaging
- `frontend/src/lib/abi/UserRegistry.json` - Added events and functions

## Contracts (No Changes Needed)

- `UserRegistry.sol` - Already has public `setMyEncryptedProfile()`
- `FHEVerifier.sol` - Already implements bitmap check
- `ComplianceHook.sol` - Already has `check()` view function
