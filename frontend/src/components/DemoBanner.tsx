"use client";

import { isDemoMode } from "@/lib/demoMode";
import { Info } from "lucide-react";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium mb-1">Demo mode: actions are simulated (no deployments)</div>
          <div className="text-xs text-blue-700">
            All transactions and state changes are stored locally. Real contracts can be connected by setting NEXT_PUBLIC_DEMO_MODE=false.
          </div>
        </div>
      </div>
    </div>
  );
}
