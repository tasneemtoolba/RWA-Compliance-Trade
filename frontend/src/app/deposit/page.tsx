"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useWalletClient, useWriteContract } from "wagmi";
import { useMode } from "@/hooks/useMode";
import { fetchRoutes, executeRoute, formatSteps } from "@/lib/lifi/client";
import { DESTINATION_CONFIG, SOURCE_CHAINS_MAINNET, SOURCE_CHAINS_SEPOLIA, SUPPORTED_CHAINS, isTestnetChain } from "@/lib/lifi/constants";
import { useRouteStore } from "@/lib/store/useRouteStore";
import type { Route, RouteExecutionUpdate, RouteExecutionResult } from "@/lib/lifi/types";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { DepositForm } from "@/components/deposit/DepositForm";
import { RouteOptions } from "@/components/deposit/RouteOptions";
import { ExecutionPanel } from "@/components/deposit/ExecutionPanel";
import { ReceiptList } from "@/components/deposit/ReceiptList";
import { DepositStepList, type DepositStep } from "@/components/DepositStepList";
import { AlertCircle, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Standard ERC20 approve function ABI
const ERC20_APPROVE_ABI = [
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
] as const;

// SwapRouter address (placeholder for simulation)
const SWAP_ROUTER_ADDRESS = "0x1111111111111111111111111111111111111111" as `0x${string}`;

export default function DepositPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: walletClient } = useWalletClient();
    const { mode } = useMode();
    const { setLastRoute } = useRouteStore();

    // Wagmi hook for simulating approval transaction
    const { writeContract: writeApprove, isPending: isApproving } = useWriteContract();

    // Get source chains based on mode
    const sourceChains = mode === "demo" ? SOURCE_CHAINS_SEPOLIA : SOURCE_CHAINS_MAINNET;
    const defaultFromChain = mode === "demo" ? SUPPORTED_CHAINS.SEPOLIA : 8453; // Base for mainnet

    const [fromChain, setFromChain] = useState(defaultFromChain);
    const [fromToken, setFromToken] = useState("0x0000000000000000000000000000000000000000"); // ETH
    const [amount, setAmount] = useState("");
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentStep, setCurrentStep] = useState<number | undefined>();
    const [executionResult, setExecutionResult] = useState<RouteExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [depositSteps, setDepositSteps] = useState<DepositStep[]>([]);

    // Destination is fixed based on mode
    const toChain = mode === "demo" ? SUPPORTED_CHAINS.SEPOLIA : SUPPORTED_CHAINS.ETHEREUM;
    const toToken = mode === "demo" 
        ? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" // Sepolia USDC
        : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Mainnet USDC

    // Check if using testnets (LI.FI doesn't support them)
    const isUsingTestnet = isTestnetChain(fromChain) || isTestnetChain(toChain);

    const handleGetRoutes = async () => {
        if (!amount || !address) {
            setError("Please enter an amount and connect wallet");
            return;
        }

        setIsLoadingRoutes(true);
        setError(null);
        setRoutes([]);
        setSelectedRoute(null);

        try {
            // Convert amount to wei (assuming 18 decimals for ETH, adjust for other tokens)
            const decimals = fromToken === "0x0000000000000000000000000000000000000000" ? 18 : 6;
            const fromAmount = parseUnits(amount, decimals).toString();

            const fetchedRoutes = await fetchRoutes({
                fromChainId: fromChain,
                toChainId: toChain,
                fromToken,
                toToken,
                fromAmount,
                fromAddress: address,
                toAddress: address,
            });

            setRoutes(fetchedRoutes);
            if (fetchedRoutes.length > 0) {
                setSelectedRoute(fetchedRoutes[0]);
                const formattedSteps = formatSteps(fetchedRoutes[0]);
                setDepositSteps(
                    formattedSteps.map((step) => ({
                        stepNumber: step.stepNumber,
                        description: step.description,
                        status: "pending" as const,
                        estimatedTime: step.estimatedTime,
                    }))
                );
            } else {
                setError("No routes found. Try adjusting your amount or tokens.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to get routes");
        } finally {
            setIsLoadingRoutes(false);
        }
    };

    const handleExecuteRoute = async () => {
        if (!selectedRoute || !address || !walletClient) {
            setError("Please connect wallet and select a route");
            return;
        }

        setIsExecuting(true);
        setError(null);
        setCurrentStep(0);

        try {
            const result = await executeRoute(selectedRoute, {
                getSigner: async () => walletClient,
                onUpdate: (update: RouteExecutionUpdate) => {
                    // Update current step
                    const stepIndex = selectedRoute.steps.findIndex((s) => s.id === update.step.id);
                    if (stepIndex !== -1) {
                        setCurrentStep(stepIndex + 1);
                    }

                    // Update deposit steps UI
                    setDepositSteps((prev) => {
                        const updated = [...prev];
                        if (stepIndex >= 0 && stepIndex < updated.length) {
                            updated[stepIndex] = {
                                ...updated[stepIndex],
                                status: update.status === "done" ? "done" : update.status === "failed" ? "failed" : "pending",
                                txHash: update.process.txHash,
                            };
                        }
                        return updated;
                    });
                },
            });

            setExecutionResult(result);
            setLastRoute(result);

            // After route execution, execute a contract call (for Composer bounty)
            // Approve USDC to SwapRouter for immediate trading - simulate MetaMask transaction
            if (result.success && result.receivedAmount) {
                try {
                    // Get the destination token address
                    const tokenAddress = (mode === "demo" 
                        ? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" // Sepolia USDC
                        : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48") as `0x${string}`; // Mainnet USDC

                    // Simulate MetaMask transaction for USDC approval
                    toast.info("Approving USDC for trading...", {
                        description: "Confirm the transaction in MetaMask",
                    });

                    writeApprove({
                        address: tokenAddress,
                        abi: ERC20_APPROVE_ABI,
                        functionName: "approve",
                        args: [
                            SWAP_ROUTER_ADDRESS,
                            result.receivedAmount ? BigInt(result.receivedAmount) : maxUint256,
                        ],
                    });
                } catch (approveError: any) {
                    console.warn("Failed to approve USDC:", approveError);
                    toast.warning("USDC approval skipped", {
                        description: approveError.message || "You can approve manually later",
                    });
                    // Don't fail the whole flow if approval fails
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to execute route");
            setExecutionResult({
                route: selectedRoute,
                stepReceipts: [],
                finalTxHash: "",
                success: false,
            });
        } finally {
            setIsExecuting(false);
            setCurrentStep(undefined);
        }
    };

    // Demo mode now supports LI.FI with Sepolia testnets

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold">Deposit from Anywhere</h1>
                <p className="mt-2 text-slate-600">Cross-chain funding via LI.FI Composer</p>
            </div>

            {/* Testnet Warning */}
            {isUsingTestnet && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-medium mb-1">Testnet Detected</div>
                            <div className="text-blue-700">
                                LI.FI no longer supports testnets for routing. Routes shown here are simulated for demo purposes.
                                For real cross-chain routes, switch to mainnet chains (Base, Arbitrum, Optimism, or Ethereum).
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Form */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Route Builder</h2>
                <DepositForm
                    fromChain={fromChain}
                    fromToken={fromToken}
                    amount={amount}
                    onFromChainChange={setFromChain}
                    onFromTokenChange={setFromToken}
                    onAmountChange={setAmount}
                    mode={mode}
                    sourceChains={sourceChains}
                />

                <Button
                    onClick={handleGetRoutes}
                    disabled={!amount || isLoadingRoutes || !isConnected}
                    className="w-full mt-6 btn-primary"
                >
                    {isLoadingRoutes ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting Routes...
                        </>
                    ) : (
                        "Get Routes"
                    )}
                </Button>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        {error}
                    </div>
                )}
            </div>

            {/* Route Options */}
            {routes.length > 0 && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Available Routes</h2>
                    <RouteOptions
                        routes={routes}
                        selectedRoute={selectedRoute}
                        onSelectRoute={(route) => {
                            setSelectedRoute(route);
                            const formattedSteps = formatSteps(route);
                            setDepositSteps(
                                formattedSteps.map((step) => ({
                                    stepNumber: step.stepNumber,
                                    description: step.description,
                                    status: "pending" as const,
                                    estimatedTime: step.estimatedTime,
                                }))
                            );
                        }}
                    />
                </div>
            )}

            {/* Route Steps */}
            {selectedRoute && depositSteps.length > 0 && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Route Steps</h2>
                    <DepositStepList steps={depositSteps} mode={mode} />
                </div>
            )}

            {/* Execution Panel */}
            {selectedRoute && (
                <ExecutionPanel
                    route={selectedRoute}
                    isExecuting={isExecuting}
                    currentStep={currentStep}
                    totalSteps={selectedRoute.steps.length}
                    error={error}
                    onExecute={handleExecuteRoute}
                />
            )}

            {/* Receipts */}
            {executionResult && (
                <ReceiptList result={executionResult} mode={mode} />
            )}
        </div>
    );
}
