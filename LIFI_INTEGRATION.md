# LI.FI Integration Guide

## Overview

LI.FI is integrated for cross-chain deposits, allowing users to bridge/swap funds from multiple chains to your destination chain (Sepolia for demo, Ethereum for production).

## How LI.FI is Called and Used

### 1. **SDK Installation**
- Package: `@lifi/sdk` v3.15.5
- Location: `frontend/package.json`

### 2. **Client Wrapper** (`frontend/src/lib/lifi/client.ts`)
The LI.FI SDK is wrapped in a client module that:
- **Dynamically imports** `@lifi/sdk` to avoid SSR issues
- Provides two main functions:
  - `fetchRoutes()` - Gets available routes from source → destination
  - `executeRoute()` - Executes a selected route with wallet signing

### 3. **Route Fetching Flow**
```typescript
// User clicks "Get Routes" on deposit page
handleGetRoutes() {
  // Calls fetchRoutes() with:
  // - fromChainId, toChainId
  // - fromToken, toToken addresses
  // - fromAmount (in wei)
  // - fromAddress, toAddress
  
  // LI.FI SDK getRoutes() returns available routes
  // Routes are displayed in RouteOptions component
}
```

### 4. **Route Execution Flow**
```typescript
// User selects a route and clicks "Execute"
handleExecuteRoute() {
  // Calls executeRoute() with:
  // - selected route
  // - wallet signer (from wagmi)
  // - onUpdate callback (for step-by-step progress)
  
  // LI.FI SDK executeRoute() executes each step:
  // 1. Token approvals (if needed)
  // 2. Swap/bridge transactions
  // 3. Final destination transfer
  
  // Progress is shown in ExecutionPanel
  // Receipts are displayed in ReceiptList
}
```

## Sepolia Testnet Support

### ✅ **Updated Configuration**

LI.FI now supports Sepolia testnets. The following updates were made:

#### **1. Chain Constants** (`frontend/src/lib/lifi/constants.ts`)
- Added Sepolia testnet chains:
  - `SEPOLIA` (11155111) - Ethereum Sepolia
  - `BASE_SEPOLIA` (84532) - Base Sepolia
  - `ARBITRUM_SEPOLIA` (421614) - Arbitrum Sepolia
  - `OPTIMISM_SEPOLIA` (11155420) - Optimism Sepolia

- Added default tokens for each testnet (ETH + USDC addresses)

#### **2. Source Chains**
- **Demo Mode**: Uses `SOURCE_CHAINS_SEPOLIA` (all Sepolia testnets)
- **Production Mode**: Uses `SOURCE_CHAINS_MAINNET` (Base, Arbitrum, Ethereum)

#### **3. Destination Configuration**
- **Demo Mode**: Sepolia (11155111) with Sepolia USDC
- **Production Mode**: Ethereum (1) with Mainnet USDC

#### **4. Mode Configuration** (`frontend/src/lib/mode.ts`)
- Updated `lifiEnabled: true` for demo mode (was `false`)

#### **5. Deposit Page** (`frontend/src/app/deposit/page.tsx`)
- Removed demo mode blocking
- Dynamically selects source chains based on mode
- Sets correct destination chain/token based on mode

#### **6. Deposit Form** (`frontend/src/components/deposit/DepositForm.tsx`)
- Accepts `sourceChains` prop (different for demo vs production)
- Shows correct destination chain based on mode

## Usage Flow

### Demo Mode (Sepolia)
1. User selects source chain: **Sepolia, Base Sepolia, Arbitrum Sepolia, or Optimism Sepolia**
2. User selects token: **ETH or USDC** (testnet addresses)
3. User enters amount
4. Clicks "Get Routes" → LI.FI fetches routes between testnets
5. User selects a route
6. Clicks "Execute" → LI.FI executes swap/bridge on testnets
7. Funds arrive on **Sepolia** for trading

### Production Mode (Mainnet)
1. User selects source chain: **Base, Arbitrum, or Ethereum**
2. User selects token: **ETH or USDC** (mainnet addresses)
3. User enters amount
4. Clicks "Get Routes" → LI.FI fetches routes between mainnets
5. User selects a route
6. Clicks "Execute" → LI.FI executes swap/bridge on mainnets
7. Funds arrive on **Ethereum** for trading

## LI.FI SDK API Usage

### Route Fetching
```typescript
import { getRoutes } from "@lifi/sdk";

const response = await getRoutes({
  fromChainId: 11155111, // Sepolia
  toChainId: 11155111,   // Sepolia (same for demo)
  fromTokenAddress: "0x...", // ETH or USDC
  toTokenAddress: "0x...",   // USDC
  fromAmount: "1000000000000000000", // 1 ETH in wei
  fromAddress: "0x...",
  toAddress: "0x...",
  options: {
    maxPriceImpact: 0.5,
    order: "RECOMMENDED",
  },
});

const routes = response.routes; // Array of Route objects
```

### Route Execution
```typescript
import { executeRoute } from "@lifi/sdk";

const result = await executeRoute({
  route: selectedRoute,
  signer: walletClient, // wagmi/viem signer
  updateCallback: (update) => {
    // Called for each step update
    console.log("Step:", update.step.id);
    console.log("Status:", update.status);
    console.log("TxHash:", update.process.txHash);
  },
});

// Result contains:
// - stepReceipts: Array of transaction receipts
// - finalTxHash: Final transaction hash
// - success: boolean
// - receivedAmount: Final amount received
```

## Components

### `DepositForm`
- Chain selection dropdown (dynamic based on mode)
- Token selection dropdown (ETH/USDC)
- Amount input
- Shows destination (fixed based on mode)

### `RouteOptions`
- Displays available routes from LI.FI
- Shows route details (steps, time, cost)
- User can select a route

### `ExecutionPanel`
- Shows execution progress
- Displays current step
- Shows transaction hashes
- "Execute Route" button

### `ReceiptList`
- Shows all step receipts after execution
- Links to block explorers
- Displays final received amount

## Error Handling

The client wrapper includes:
- **Mock fallback**: If `@lifi/sdk` is not available, uses mock routes
- **Error catching**: Catches and displays LI.FI API errors
- **User feedback**: Shows error messages in UI

## Testing

### Test on Sepolia
1. Switch to **Demo Mode**
2. Go to `/deposit`
3. Select **Sepolia** or **Base Sepolia** as source
4. Enter a small amount (e.g., 0.001 ETH)
5. Click "Get Routes"
6. Verify routes are returned
7. Select a route and execute

### Test on Mainnet
1. Switch to **Production Mode**
2. Go to `/deposit`
3. Select **Base** or **Arbitrum** as source
4. Enter amount
5. Click "Get Routes"
6. Execute route (requires real funds)

## Notes

- **LI.FI SDK v3** uses direct function exports (`getRoutes`, `executeRoute`)
- Routes are fetched **client-side** (no server-side calls)
- Execution requires **wallet connection** (wagmi/viem)
- **Sepolia testnets** are fully supported for demo/testing
- **Mainnet** routes work for production deployments

## Troubleshooting

### No routes found
- Check that source/destination chains are supported
- Verify token addresses are correct for the chain
- Ensure amount is sufficient (minimums may apply)

### Execution fails
- Check wallet has sufficient balance
- Verify wallet is connected to correct network
- Check token approvals (may need to approve first)

### SDK not found
- Verify `@lifi/sdk` is installed: `npm list @lifi/sdk`
- Check import path in `client.ts`
- Mock implementation will be used if SDK unavailable
