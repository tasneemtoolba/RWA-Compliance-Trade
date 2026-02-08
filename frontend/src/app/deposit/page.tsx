"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { useMode } from "@/hooks/useMode";
import { fetchRoutes, executeRoute, formatSteps } from "@/lib/lifi/client";
import { DESTINATION_CONFIG, SOURCE_CHAINS } from "@/lib/lifi/constants";
import { useRouteStore } from "@/lib/store/useRouteStore";
import type { Route, RouteExecutionUpdate, RouteExecutionResult } from "@/lib/lifi/types";
import { parseUnits, formatUnits } from "viem";
import { DepositForm } from "@/components/deposit/DepositForm";
import { RouteOptions } from "@/components/deposit/RouteOptions";
import { ExecutionPanel } from "@/components/deposit/ExecutionPanel";
import { ReceiptList } from "@/components/deposit/ReceiptList";
import { DepositStepList, type DepositStep } from "@/components/DepositStepList";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DepositPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: walletClient } = useWalletClient();
    const { mode } = useMode();
    const { setLastRoute } = useRouteStore();

    const [fromChain, setFromChain] = useState(8453); // Base
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

    // Destination is fixed
    const toChain = DESTINATION_CONFIG.chainId;
    const toToken = DESTINATION_CONFIG.token;

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

            // After route execution, optionally execute a contract call (for Composer bounty)
            // This could be USDC.approve() or DepositVault.credit()
            // For now, we'll just show the result
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

    if (mode === "demo") {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-semibold">Deposit from Anywhere</h1>
                    <p className="mt-2 text-slate-600">Cross-chain funding via LI.FI</p>
                </div>
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                            <div className="font-medium text-yellow-800 mb-1">
                                Switch to Production mode to deposit
                            </div>
                            <div className="text-sm text-yellow-700">
                                LI.FI does not support testnets. Use Production Mode (Mainnet) for live route execution.
                                Demo mode shows the UI structure only.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold">Deposit from Anywhere</h1>
                <p className="mt-2 text-slate-600">Cross-chain funding via LI.FI Composer</p>
            </div>

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
