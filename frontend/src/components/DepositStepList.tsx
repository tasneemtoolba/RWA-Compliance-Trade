"use client";

import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { ExternalLink } from "lucide-react";

export interface DepositStep {
  stepNumber: number;
  description: string;
  status: "pending" | "done" | "failed";
  txHash?: string;
  estimatedTime?: string;
}

interface DepositStepListProps {
  steps: DepositStep[];
  mode: "demo" | "production";
}

export function DepositStepList({ steps, mode }: DepositStepListProps) {
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div
          key={step.stepNumber}
          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
        >
          <div className="flex items-center gap-3 flex-1">
            {step.status === "done" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : step.status === "failed" ? (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-medium text-slate-900">
                {step.stepNumber}. {step.description}
              </div>
              {step.estimatedTime && (
                <div className="text-xs text-slate-500 mt-1">
                  {step.estimatedTime}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step.status === "done" && (
              <span className="text-xs text-green-600 font-medium">Done!</span>
            )}
            {step.txHash && (
              <a
                href={`https://etherscan.io/tx/${step.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
