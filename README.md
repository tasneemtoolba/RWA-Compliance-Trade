# CloakSwap RWA — Private Eligibility Trading with Cross-Chain Funding

A Uniswap v4 Hook–gated market where users can trade tokenized RWAs (demo: gGOLD) only if they meet eligibility rules, without exposing personal data onchain. Users can fund the market from any chain via LI.FI. Wallet identity and preferences are portable via ENS.

## Overview

CloakSwap RWA implements a privacy-preserving compliance system for tokenized real-world assets. Eligibility is stored as encrypted ciphertext onchain, and a Uniswap v4 hook enforces compliance rules before allowing swaps. Only pass/fail results are revealed, not the underlying eligibility attributes.

## Bounty Alignment

### Uniswap v4 Privacy DeFi
- Eligibility stored as ciphertext only (no plaintext attributes)
- Hook enforces compliance in `beforeSwap` (verifiable, deterministic)
- Onchain remains auditable: hook emits pass/fail + reason codes
- Demo includes transaction examples: one success, one revert with reason

### LI.FI Composer Integration
- Uses LI.FI SDK/API for cross-chain routes
- Supports 2+ EVM chains end-to-end (Base, Arbitrum, Ethereum)
- Working frontend that judges can interact with
- Handles slippage/errors and shows step receipts

### ENS Integration
- Actual ENS reads (resolve name / reverse lookup)
- Trading preferences stored as ENS text records:
  - `com.cloakswap.preferredChain`
  - `com.cloakswap.preferredToken`
  - `com.cloakswap.displayName`
- Preferences prefill deposit flow and personalize UX

## Architecture

### Smart Contracts

**UserRegistry.sol**
Stores encrypted profile bitmap as `bytes` ciphertext per wallet address.
- `selfRegister(ciphertext, expiry)` - self-service registration
- `selfUpdateProfile(ciphertext, expiry)` - self-service profile update
- `setEncryptedProfileFor(user, ciphertext, expiry)` - owner-only admin function
- `getEncryptedProfile(user)` - returns ciphertext + expiry

**FHEVerifier.sol**
Verifies encrypted bitmap against rule mask using the predicate: `(userBitmap & ruleMask) == ruleMask`.
- `verify(ciphertext, ruleMask)` - returns boolean eligibility
- Dev fallback: decodes `abi.encode(uint256)` for local tests
- Production: will use fhEVM TFHE operations for real FHE

**ComplianceHook.sol**
Uniswap v4 hook with `beforeSwap` gating logic.
- Checks credential exists and is not expired
- Calls `verifier.verify(ciphertext, ruleMask)`
- Reverts with reason codes or allows swap
- Emits `ComplianceCheck(user, poolId, eligible, reasonCode)` events
- Public `check(user, poolId)` helper for frontend queries

### Frontend Pages

- `/` - Landing page with project overview
- `/explore` - Market directory showing gGOLD market card with eligibility status
- `/verify` - Create encrypted eligibility profile (client-side encryption)
- `/trade` - Swap interface with hook gating and audit trail
- `/deposit` - LI.FI Composer routes for cross-chain funding
- `/profile` - ENS identity, preferences, credential status, and transaction history
- `/credentials` - Credential details (ciphertext hash and expiry)
- `/docs` - Technical documentation and threat model
- `/admin` - Owner tools (set pool rule mask, issue credentials)

## Privacy Model

**Onchain (Public):**
- Encrypted ciphertext (bytes)
- Expiry timestamp (uint64)
- Pool rule mask (uint256)
- ComplianceCheck events (pass/fail + reason code)

**Not Onchain (Private):**
- Region (plaintext)
- Accredited status (plaintext)
- Max trade bucket (plaintext)
- User bitmap (plaintext)

## User Flow

### Demo Mode (Sepolia) — Privacy + Hook Gating

1. Connect wallet → ENS name resolved and displayed
2. Explore → View "gGOLD Market" card with eligibility status
3. Get Verified:
   - User selects attributes (region, accredited, limit bucket, expiry)
   - Browser encrypts bitmap (Zama client-side) → stores ciphertext + expiry onchain
4. Trade:
   - User attempts swap
   - v4 Hook runs `beforeSwap`
   - Hook checks ciphertext against pool rule mask → allow or revert
   - Emits `ComplianceCheck` event with reason code

### Production Mode (Mainnet/Base/Arb) — LI.FI Funding

1. Deposit from anywhere (LI.FI):
   - User chooses fromChain/fromToken/amount
   - App uses LI.FI Composer to build route: swap and/or bridge into target chain/token
   - Shows step receipts and final balance result

2. ENS enhancements:
   - Profile displays ENS name and address
   - Shows credential status and recent hook checks
   - Preferences section writes/reads ENS text records
   - Preferences automatically prefill deposit flow

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install
cd frontend && npm install
```

### Demo Mode (No Deployment Required)

Set environment variable to enable simulation mode:

```bash
cd frontend
echo "NEXT_PUBLIC_DEMO_MODE=true" > .env.local
npm run dev
```

All flows work without contract deployments. State is stored in localStorage.

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

1. Navigate to `/admin`
2. Set pool rule mask (default: `0x403` = accredited + EU + bucket=1k)
3. Or use the "Configure Pool Rule" button on `/trade` page

### Seed Demo Data

```bash
npx hardhat run scripts/seed-demo.ts --network sepolia
```

## Testing

```bash
# Run tests
npx hardhat test

# Test cases:
# - Eligible user succeeds
# - Ineligible user fails
# - Expired credential fails
# - Missing credential fails
```

## Bounty Checklist

### Uniswap Foundation
- [x] Hook gating in `beforeSwap`
- [x] Demo transaction examples: one success, one revert with reason
- [x] Repository, README, and demo video ready

### LI.FI
- [x] Uses LI.FI SDK/API
- [x] Supports 2+ EVM chains end-to-end
- [x] Working frontend that judges can interact with
- [x] Handles slippage/errors and shows receipts

### ENS
- [x] Actual ENS reads (resolve name / reverse lookup)
- [x] Actual ENS write: storing preferences via ENS text records
- [x] Preferences used to prefill deposit flow

## Project Structure

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

## Demo Script

1. Connect wallet (show ENS resolution)
2. Explore → View gGOLD market and eligibility status
3. Get Verified → Encrypt profile and save onchain
4. Trade → Run hook check and show pass/fail result
5. Profile → Display credential status and ENS preferences
6. Deposit (Production) → Show LI.FI route and execute

## License

MIT
