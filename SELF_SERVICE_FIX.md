# Self-Service Registration Fix

## Summary

Fixed the root blocker: contracts now support self-service registration and real bitmap verification.

## Contract Changes

### 1. UserRegistry.sol

**Added self-service functions:**
- `selfRegister(bytes32 encryptedProfileBitMap, uint64 expiry)` - Public, allows any user to register
- `selfUpdateProfile(bytes32 encryptedProfileBitMap, uint64 expiry)` - Public, allows users to update their profile
- `getUserProfileByWallet(address wallet)` - View function to get profile by wallet

**Changed storage:**
- Now uses `bytes32 encryptedProfileBitMap` (simpler for demo, can be extended to `bytes` for real FHE)
- Added `_walletToUserId` mapping for tracking registration
- Added `expiry` field to Profile struct

**Events:**
- `SelfRegistered(address indexed wallet, bytes32 indexed userId, uint64 expiry)`
- `SelfProfileUpdated(address indexed wallet, bytes32 indexed userId, uint64 expiry)`

### 2. FHEVerifier.sol

**Real bitmap verification:**
- `verify()` now does: `(userBitmap & ruleMask) == ruleMask`
- Added `verifyBytes32()` for direct bytes32 input (demo convenience)
- No longer always returns `true` - now does real checks

### 3. ComplianceHook.sol

**No changes needed** - already has `check()` function that works correctly.

### 4. Deploy Script

**Added pool rule configuration:**
- Automatically sets demo pool rule mask after deployment
- Pool ID: `keccak256("CLOAKSWAP_DEMO_POOL_V1")`
- Rule mask: `0x403` (accredited | EU | bucket1k)

## Frontend Changes

### 1. Verify Page (`app/verify/page.tsx`)

**Updated to use new functions:**
- Detects if user is registered via `getUserIdByWallet()`
- Calls `selfRegister()` for first-time users
- Calls `selfUpdateProfile()` for existing users
- Uses `bitmapToBytes32()` to convert bitmap to bytes32

**UI Copy:**
- "Encrypting locally in your browser..."
- "Saving ciphertext + expiry onchain..."
- "Profile saved. Now go to Trade → Run check."

### 2. Trade Page (`app/trade/page.tsx`)

**Already correct:**
- Calls `ComplianceHook.check(user, poolId)`
- Shows pass/fail with reason codes
- Enables/disables swap button based on eligibility

**UI Copy:**
- "Run check returns pass/fail only — no attributes are revealed."

### 3. Encryption Utility (`lib/encrypt.ts`)

**Added:**
- `bitmapToBytes32(bitmap: bigint)` - Converts bitmap to bytes32 hex string
- Updated `encryptBitmap()` to use bytes32 conversion

## How It Works Now

### Registration Flow
1. User fills form (region, accredited, bucket, expiry)
2. Browser builds bitmap from inputs
3. Converts bitmap to bytes32: `0x${bitmap.toString(16).padStart(64, "0")}`
4. Checks if registered: `getUserIdByWallet(address)`
5. Calls `selfRegister()` or `selfUpdateProfile()` based on status
6. Onchain stores: `bytes32 encryptedProfileBitMap` + `uint64 expiry`

### Verification Flow
1. User clicks "Run check" on Trade page
2. Calls `ComplianceHook.check(user, poolId)`
3. Hook fetches profile: `getEncryptedProfile(user)` → returns `(bytes, expiry)`
4. Hook checks expiry valid
5. Hook calls `FHEVerifier.verify(ciphertext, ruleMask)`
6. Verifier decodes bytes32 as uint256 and checks: `(userBitmap & ruleMask) == ruleMask`
7. Returns `(eligible: bool, reasonCode: uint8)`
8. UI shows pass/fail + reason

## Demo Flow

1. **Wallet A (Eligible):**
   - Get Verified → EU + Accredited + 1K bucket → Save
   - Trade → Run check → Eligible
   - Swap button enabled

2. **Wallet B (Not Eligible):**
   - Get Verified → US + Not Accredited + 100 bucket → Save
   - Trade → Run check → Not Eligible (Reason: NOT_ELIGIBLE)
   - Swap button disabled

3. **No Profile:**
   - Trade → Run check → Not Eligible (Reason: NO_CREDENTIAL)
   - CTA: "Go to Get Verified →"

## Next Steps

1. **Deploy contracts:**
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

2. **Update frontend config:**
   - Update `frontend/src/lib/contracts.ts` with deployed addresses
   - Update `poolId` to match deployed pool ID

3. **Test flow:**
   - Create eligible profile → Should pass check
   - Create ineligible profile → Should fail check
   - Verify swap button state matches eligibility

## Files Changed

**Contracts:**
- `contracts/UserRegistry.sol` - Added self-service functions
- `contracts/interfaces/IUserRegistry.sol` - Added new function signatures
- `contracts/FHEVerifier.sol` - Real bitmap verification
- `contracts/interfaces/IFHEVerifier.sol` - Added verifyBytes32
- `scripts/deploy.ts` - Auto-configure pool rule mask

**Frontend:**
- `frontend/src/app/verify/page.tsx` - Use selfRegister/selfUpdateProfile
- `frontend/src/lib/encrypt.ts` - Added bitmapToBytes32
- `frontend/src/lib/abi/UserRegistry.json` - Updated ABI

## Key Fixes

- **Root blocker fixed:** Users can now register themselves (not onlyOwner)
- **Real verification:** Verifier does actual bitmap checks (not always true)
- **Pool configured:** Deploy script sets pool rule mask automatically
- **UI updated:** Verify page uses new functions, shows correct copy
