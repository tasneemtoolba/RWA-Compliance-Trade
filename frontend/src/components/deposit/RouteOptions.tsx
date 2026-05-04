"use client";

import type { Route } from "@/lib/lifi/types";
import { CHAIN_NAMES, isTestnetChain } from "@/lib/lifi/constants";
import { CheckCircle2, Clock, DollarSign, AlertTriangle } from "lucide-react";

interface RouteOptionsProps {
  routes: Route[];
  selectedRoute: Route | null;
  onSelectRoute: (route: Route) => void;
}

export function RouteOptions({ routes, selectedRoute, onSelectRoute }: RouteOptionsProps) {
  if (routes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        No routes found. Try adjusting your amount or tokens.
      </div>
    );
  }

  // Check if any route is a simulation (testnet)
  const hasSimulation = routes.some(
    (route) =>
      route.tags?.includes("simulation") ||
      route.tags?.includes("demo") ||
      isTestnetChain(route.fromChainId) ||
      isTestnetChain(route.toChainId)
  );
  
  return (
    <div className="space-y-3">
      {hasSimulation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium mb-1">Simulation Mode</div>
              <div className="text-amber-700">
                LI.FI no longer supports testnets. These routes are simulated for demo purposes.
                For real routes, switch to mainnet chains (Base, Arbitrum, Optimism, or Ethereum).
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="text-sm font-medium text-slate-700">
        Available Routes ({routes.length})
      </div>
      {routes.slice(0, 3).map((route) => {
        const isSelected = selectedRoute?.id === route.id;
        const stepCount = route.steps.length;
        const isRecommended = route.tags?.includes("RECOMMENDED") || route.tags?.includes("recommended");
        const isSimulation = route.tags?.includes("simulation") || route.tags?.includes("demo");
        
        return (
          <button
            key={route.id}
            onClick={() => onSelectRoute(route)}
            className={`w-full text-left rounded-xl border-2 p-4 transition ${
              isSelected
                ? "border-primary-brand bg-primary-brand/5"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isSimulation && (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Simulation
                    </span>
                  )}
                  {isRecommended && !isSimulation && (
                    <span className="text-xs font-medium text-primary-brand bg-primary-brand/10 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-primary-brand" />
                  )}
                </div>
                <div className="text-sm font-medium text-slate-900 mb-1">
                  {CHAIN_NAMES[route.fromChainId]} → {CHAIN_NAMES[route.toChainId]}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    {route.steps.length} step{route.steps.length > 1 ? "s" : ""}
                  </div>
                  {route.gasCosts && route.gasCosts.length > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Gas: ~{route.gasCosts[0].amountUSD || "N/A"}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {parseFloat(route.toAmount) > 0
                    ? `${parseFloat(route.toAmount).toFixed(6)} ${route.toToken.symbol}`
                    : "Calculating..."}
                </div>
                {route.toAmountUSD && (
                  <div className="text-xs text-slate-500">
                    ≈ ${parseFloat(route.toAmountUSD).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
