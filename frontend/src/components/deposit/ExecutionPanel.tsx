"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Route } from "@/lib/lifi/types";

interface ExecutionPanelProps {
  route: Route | null;
  isExecuting: boolean;
  currentStep?: number;
  totalSteps?: number;
  error: string | null;
  onExecute: () => void;
}

export function ExecutionPanel({
  route,
  isExecuting,
  currentStep,
  totalSteps,
  error,
  onExecute,
}: ExecutionPanelProps) {
  if (!route) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        Select a route to execute
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-slate-900">Route Execution</div>
          {isExecuting && currentStep && totalSteps && (
            <div className="text-sm text-slate-600">
              Step {currentStep} of {totalSteps}
            </div>
          )}
        </div>
        
        {isExecuting && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing route...</span>
            </div>
            {currentStep && totalSteps && (
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-primary-brand h-2 rounded-full transition-all"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-red-800">
              <div className="font-medium">Execution Error</div>
              <div className="mt-1">{error}</div>
            </div>
          </div>
        )}
        
        <Button
          onClick={onExecute}
          disabled={isExecuting || !route}
          className="w-full mt-4 btn-primary"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Execute Route
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
