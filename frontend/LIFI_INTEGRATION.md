# LI.FI SDK Integration Guide

## Installation

```bash
npm install @lifi/sdk
```

## How to Use LI.FI SDK in CloakSwap

### 1. Client Wrapper (`lib/lifi/client.ts`)

The client wrapper provides a clean interface to LI.FI SDK:

- **`fetchRoutes(params)`**: Fetches best routes from LI.FI
- **`executeRoute(route, options)`**: Executes a selected route with wallet signer
- **`formatSteps(route)`**: Formats route steps for UI display

### 2. Usage in Deposit Page

The deposit page (`app/deposit/page.tsx`) demonstrates the complete flow:

1. **User selects source chain/token/amount**
2. **Calls `fetchRoutes()`** to get route options
3. **User selects a route**
4. **Calls `executeRoute()`** with wallet signer
5. **Shows progress** via `onUpdate` callback
6. **Displays receipts** after completion

### 3. Route Execution Flow

```typescript
// Get routes
const routes = await fetchRoutes({
  fromChainId: 8453, // Base
  toChainId: 11155111, // Sepolia (or 1 for Mainnet)
  fromToken: "0x0000000000000000000000000000000000000000", // ETH
  toToken: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC
  fromAmount: parseUnits("0.01", 18).toString(),
  fromAddress: address,
  toAddress: address,
});

// Execute route
const result = await executeRoute(selectedRoute, {
  getSigner: async () => walletClient,
  onUpdate: (update) => {
    // Handle step progress
    console.log(`Step ${update.step.id}: ${update.status}`);
  },
});
```

### 4. Constants Configuration

Edit `lib/lifi/constants.ts` to set:
- **Destination chain**: Currently Sepolia (11155111) for demo, change to Ethereum (1) for production
- **Destination token**: USDC address for the destination chain
- **Source chains**: Base and Arbitrum are supported

### 5. Mock vs Real SDK

The client automatically falls back to mock implementation if `@lifi/sdk` is not installed. This allows:
- Development without SDK installed
- Demo mode with mock routes
- Production mode with real LI.FI integration

### 6. Route Store

Routes are persisted in localStorage via `useRouteStore()` hook:
- Last executed route is saved
- Displayed in `/profile` page
- Cleared when needed

## For Composer Bounty

To qualify for "Best Use of LI.FI Composer", add an optional contract call step after bridging:

1. After route execution completes
2. Automatically call `USDC.approve(SwapRouter, amount)` on destination chain
3. Or call your own `DepositVault.credit(user, amount)` contract

This demonstrates the "swap + bridge + call" workflow that Composer supports.
