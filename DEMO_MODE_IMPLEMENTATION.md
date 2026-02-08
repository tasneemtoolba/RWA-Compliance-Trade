# Demo Simulation Mode Implementation

## ✅ Completed

### Core Infrastructure

1. **Demo Mode Configuration** (`lib/demoMode.ts`)
   - `DEMO_MODE` flag from `NEXT_PUBLIC_DEMO_MODE` env var
   - `withDemo()` helper for conditional execution
   - `isDemoMode()` check function

2. **Mock Onchain Registry** (`lib/mock/onchain.ts`)
   - localStorage-based state management
   - `selfRegister()` / `selfUpdateProfile()` functions
   - `getProfile()` / `getUserIdByWallet()` functions
   - `setPoolRule()` / `getPoolRule()` functions
   - `creditBalance()` / `debitBalance()` / `getBalances()` functions
   - `addHookAuditEntry()` / `getHookAudit()` functions
   - `fakeTxHash()` for deterministic transaction hashes
   - `delay()` for async simulation

3. **Mock FHE Encryption** (`lib/mock/fhe.ts`)
   - `encodeEligibilityToBitmap()` - encodes form inputs to bitmap
   - `encryptBitmap()` - converts bitmap to bytes32 hex string
   - Bit layout: bit0=accredited, bit1=EU, bit2=US, bit3=bucket>=1K, bit4=bucket>=10K

4. **Mock Hook Check** (`lib/mock/hook.ts`)
   - `checkUserCompliance()` - simulates ComplianceHook.check()
   - `simulateSwap()` - simulates swap with compliance gating
   - Real bitmap verification: `(userBitmap & ruleMask) == ruleMask`
   - Returns proper reason codes: ELIGIBLE, NOT_REGISTERED, EXPIRED, NOT_ELIGIBLE

5. **Mock LI.FI Flow** (`lib/mock/lifi.ts`)
   - `getRoutes()` - returns 3 route options (recommended, fastest, cheapest)
   - `executeRoute()` - simulates step-by-step execution with progress callbacks
   - Multi-step routes: swap → bridge → approve
   - Updates balances on completion

6. **Mock ENS Identity** (`lib/mock/ens.ts`)
   - `reverseResolve()` - wallet → ENS name
   - `getAvatar()` - returns avatar URL or generated gradient
   - `resolve()` - ENS name → address

7. **Unified Service Layer** (`lib/services/*.ts`)
   - `registry.ts` - unified registry functions
   - `hook.ts` - unified hook check functions
   - `pool.ts` - unified pool rule functions
   - `balances.ts` - unified balance functions
   - `audit.ts` - unified audit functions
   - All services switch between demo mocks and real contracts automatically

8. **UI Components**
   - `DemoBanner.tsx` - shows demo mode disclaimer
   - Updated `AppShell.tsx` - shows "Demo (Simulated)" badge in navbar

9. **Updated Pages**
   - ✅ `app/verify/page.tsx` - Full demo mode support
     - Form: region, accredited, bucket, expiry
     - Encrypt & Save button works
     - Shows success state with tx hash
     - Runs hook check after save
     - Shows eligibility preview
   - ✅ `app/trade/page.tsx` - Full demo mode support
     - Run check button works
     - Shows eligibility status
     - Swap simulation works
     - Hook audit history displayed
     - Error handling for blocked swaps

## 🔄 Remaining Work

### Pages to Update

1. **`app/deposit/page.tsx`**
   - Replace LI.FI SDK calls with `lib/mock/lifi.ts` functions
   - Use `getRoutes()` and `executeRoute()` from mock
   - Show route steps with progress
   - Update balances on completion
   - Add DemoBanner component
   - Update copy: "Cross-chain funding via LI.FI-style routes (simulated): swap → bridge → optional approve."

2. **`app/profile/page.tsx`**
   - Use `registryService.getProfile()` for credential status
   - Use `balancesService.getBalances()` for funding display
   - Use `auditService.getHookAudit()` for hook audit table
   - Use `lib/mock/ens.ts` for ENS identity (when demo mode)
   - Add DemoBanner component
   - Update copy: "Wallet identity + ENS + audit trail + balances (simulated)."

3. **`app/explore/page.tsx`**
   - Use `hookService.checkUserCompliance()` for eligibility check
   - Add DemoBanner component

### Environment Setup

Create `.env.local` file:
```bash
NEXT_PUBLIC_DEMO_MODE=true
```

### Testing Checklist

- [ ] Get Verified: Create profile → shows success → hook check works
- [ ] Trade: Run check → shows eligible/not eligible → swap works when eligible
- [ ] Deposit: Get routes → execute route → shows receipts → balances update
- [ ] Profile: Shows identity, credential status, balances, audit history
- [ ] All pages show "Demo (Simulated)" badge
- [ ] All actions show loading → success → receipt states
- [ ] Error messages are human-readable

## Architecture Notes

### State Management
- All demo state stored in localStorage under `"cloakswap_demo_state"`
- State shape:
  ```typescript
  {
    poolRules: { [poolId]: string },
    profiles: { [wallet]: { bmp: string, expiry: number } },
    balances: { [wallet]: { USDC, ETH, gGOLD } },
    hookAudit: { [wallet]: Array<AuditEntry> }
  }
  ```

### Switching to Real Contracts
When `NEXT_PUBLIC_DEMO_MODE=false`:
1. Service layer functions will call real contract functions
2. Replace mock implementations with wagmi hooks
3. Update service layer to use real contract addresses from env

### Demo Mode Benefits
- ✅ No contract deployments needed
- ✅ Full interactive demo for judges
- ✅ All flows work end-to-end
- ✅ Transparent about simulation (badges + banners)
- ✅ Easy to switch to real contracts later

## Key Features Demonstrated

Even in simulation mode, the app demonstrates:

1. **Uniswap v4 Privacy Concept**
   - Hook-gated trading
   - Minimized disclosure (only pass/fail revealed)
   - Encrypted eligibility profiles

2. **LI.FI User Journey**
   - Route builder UI
   - Step-by-step execution
   - Multi-step workflows (swap + bridge + approve)

3. **ENS Integration UX**
   - Identity resolution
   - Avatar display
   - Preferences storage (ready for real ENS)

## Next Steps

1. Update deposit and profile pages (see above)
2. Test all flows end-to-end
3. Add more error handling
4. Polish UI copy and messaging
5. Document demo mode in README
