# CloakSwap — Private Eligibility Trading + Cross-chain Funding

**A Uniswap v4 Hook–gated market where users can trade a tokenized RWA (demo: gGOLD) only if they meet eligibility rules, without exposing personal data onchain. Users can fund the market from any chain via LI.FI. Wallet identity and preferences are portable via ENS.**

## 🎯 One-Liner

A Uniswap v4 Hook–gated market where users can trade a tokenized RWA (demo: gGOLD) only if they meet eligibility rules, without exposing personal data onchain. Users can fund the market from any chain via LI.FI. Wallet identity and preferences are portable via ENS.

## ✅ Bounty Alignment

### Uniswap v4 Privacy DeFi
- ✅ Eligibility stored as ciphertext only (no plaintext attributes)
- ✅ Hook enforces compliance in `beforeSwap` (verifiable, deterministic)
- ✅ Onchain remains auditable: hook emits pass/fail + reason codes
- ✅ Demo txids: one success, one revert with reason

### LI.FI Composer / Integration
- ✅ Uses LI.FI SDK/API for cross-chain routes
- ✅ Supports 2+ EVM chains end-to-end (Base, Arbitrum, Ethereum)
- ✅ Working frontend judges can click
- ✅ Handles slippage/errors and shows step receipts

### ENS
- ✅ Actual ENS reads (resolve name / reverse)
- ✅ Creative ENS usage: trading preferences stored as ENS text records:
  - `cloakswap:preferredChain`
  - `cloakswap:preferredToken`
  - `cloakswap:displayName`
- ✅ Preferences prefill deposit flow and personalize UX

## 🏗️ Architecture

### Smart Contracts

1. **UserRegistry.sol**: Stores encrypted profile bitmap as `bytes` ciphertext per wallet
   - `setMyEncryptedProfile(ciphertext, expiry)` - self-serve
   - `setEncryptedProfileFor(user, ciphertext, expiry)` - owner-only
   - `getEncryptedProfile(user)` - returns ciphertext + expiry

2. **FHEVerifier.sol**: Verifies encrypted bitmap against rule mask
   - `verify(ciphertext, ruleMask)` - predicate: `(userBitmap & ruleMask) == ruleMask`
   - Dev fallback: decodes `abi.encode(uint256)` for local tests
   - Production: will use fhEVM TFHE operations

3. **ComplianceHook.sol**: Uniswap v4 hook with `beforeSwap` gating
   - Checks credential exists, not expired
   - Calls `verifier.verify(ciphertext, ruleMask)`
   - Reverts with reason codes or allows swap
   - Emits `ComplianceCheck(user, poolId, eligible, reasonCode)` events
   - Public `check(user, poolId)` helper for frontend

### Frontend Pages

- `/` - Landing page with quick pitch
- `/explore` - Market directory (gGOLD market card + eligibility + CTAs)
- `/verify` - Create encrypted profile (Zama client encryption)
- `/trade` - Swap screen (hook gating + audit)
- `/deposit` - LI.FI Composer routes (2+ chain journey + receipts)
- `/profile` - ENS identity + preferences + credential status + history
- `/credentials` - Credential details (ciphertext hash + expiry)
- `/docs` - Judge-friendly explanation + threat model
- `/admin` - Owner tools (set pool rule mask, issue credentials)

## 🔐 Privacy Model

**Onchain (Public):**
- Encrypted ciphertext (bytes)
- Expiry timestamp (uint64)
- Pool rule mask (uint256)
- ComplianceCheck events (pass/fail + reason)

**Not Onchain (Private):**
- Region (plaintext)
- Accredited status (plaintext)
- Max trade bucket (plaintext)
- User bitmap (plaintext)

## 📊 User Flow

### Demo Mode (Sepolia) — Privacy + Hook Gating

1. **Connect wallet** → ENS name resolved and displayed
2. **Explore** → See "gGOLD Market" card + eligibility status
3. **Get Verified**:
   - User picks attributes (region, accredited, limit bucket, expiry)
   - Browser encrypts bitmap (Zama) → stores ciphertext + expiry onchain
4. **Trade**:
   - User attempts swap
   - v4 Hook runs `beforeSwap`
   - Hook checks ciphertext against pool rule mask → allow or revert
   - Emits `ComplianceCheck` event with reason code

### Production Mode (Mainnet/Base/Arb) — LI.FI Funding

1. **Deposit from anywhere (LI.FI)**:
   - User chooses fromChain/fromToken/amount
   - App uses LI.FI Composer route: swap and/or bridge into target chain/token
   - Show step receipts + final balance result

2. **ENS enhancements**:
   - Profile shows ENS name + address
   - Displays credential status and last hook checks
   - "Preferences" writes/reads ENS text records
   - Preferences prefill deposit flow

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install
cd frontend && npm install
```

### Deploy Contracts (Sepolia)

```bash
# Set your private key
export PRIVATE_KEY=your_private_key

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia
```

### Update Contract Addresses

Update `frontend/src/lib/contracts.ts` with deployed addresses:

```typescript
export const CONTRACTS = {
  sepolia: {
    userRegistry: "0x...", // Update
    complianceHook: "0x...", // Update
    fheVerifier: "0x...", // Update
    poolId: "0x...", // Update
  },
};
```

### Run Frontend

```bash
cd frontend
npm run dev
```

### Configure Pool Rule (Owner)

1. Go to `/admin`
2. Set pool rule mask (default: `2009` = accredited + EU + bucket=1k)
3. Or use the "Configure Pool Rule" button on `/trade` page

### Seed Demo Data

```bash
npx hardhat run scripts/seed-demo.ts --network sepolia
```

## 🧪 Testing

```bash
# Run tests
npx hardhat test

# Test cases:
# - Eligible user succeeds
# - Ineligible user fails
# - Expired credential fails
# - Missing credential fails
```

## 📋 Bounty Checklist

### Uniswap Foundation ✅
- [x] Hook gating in `beforeSwap`
- [x] Demo txids: one success, one revert with reason
- [x] Repo + README + video (ready)

### LI.FI ✅
- [x] Uses LI.FI SDK/API
- [x] Supports 2+ EVM chains end-to-end
- [x] Working frontend judges can click
- [x] Handles slippage/errors and shows receipts

### ENS ✅
- [x] Actual ENS reads (resolve name / reverse)
- [x] Actual ENS write: storing preferences via ENS text records
- [x] Preferences used to prefill deposit flow

## 📁 Project Structure

```
cloakswap-rwa/
├── contracts/
│   ├── interfaces/
│   │   ├── IUserRegistry.sol
│   │   └── IFHEVerifier.sol
│   ├── UserRegistry.sol
│   ├── FHEVerifier.sol
│   ├── ComplianceHook.sol
│   ├── test/
│   │   └── compliance-hook.spec.ts
│   └── scripts/
│       ├── deploy.ts
│       └── seed-demo.ts
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx (Landing)
│   │   │   ├── explore/page.tsx
│   │   │   ├── verify/page.tsx
│   │   │   ├── trade/page.tsx
│   │   │   ├── deposit/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── credentials/page.tsx
│   │   │   ├── docs/page.tsx
│   │   │   └── admin/page.tsx
│   │   ├── lib/
│   │   │   ├── contracts.ts
│   │   │   ├── bitmap.ts
│   │   │   ├── encrypt.ts
│   │   │   ├── hook.ts
│   │   │   ├── lifi.ts
│   │   │   ├── ens.ts
│   │   │   └── mode.ts
│   │   └── components/
│   │       └── AppShell.tsx
│   └── package.json
└── README.md
```

## 🎬 Demo Script

1. **Connect wallet** (show ENS resolution)
2. **Explore** → See gGOLD market + eligibility status
3. **Get Verified** → Encrypt profile → Save onchain
4. **Trade** → Run hook check → Show pass/fail
5. **Profile** → Show credential status + ENS preferences
6. **Deposit** (Production) → Show LI.FI route + execute

## 📝 License

MIT
