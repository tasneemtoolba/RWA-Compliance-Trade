"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useMode } from "@/hooks/useMode";
import { readComplianceCheckEvents } from "@/lib/hook";
import { CONTRACTS } from "@/lib/contracts";
import { formatAddress } from "@/lib/helper";
import { ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import { reasonText } from "@/lib/contracts";

interface ComplianceEvent {
  blockNumber: bigint;
  transactionHash: string;
  args: {
    user: string;
    poolId: string;
    eligible: boolean;
    reasonCode: number;
  };
}

export function HookAuditTable() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mode } = useMode();
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cfg = CONTRACTS.sepolia;
  const isSepolia = chainId === 11155111;

  useEffect(() => {
    if (address && isConnected && isSepolia) {
      setIsLoading(true);
      readComplianceCheckEvents(address, cfg.poolId, 0n, mode)
        .then((fetchedEvents) => {
          // Take last 5 events
          const sorted = fetchedEvents
            .sort((a: any, b: any) => Number(b.blockNumber - a.blockNumber))
            .slice(0, 5);
          setEvents(sorted as ComplianceEvent[]);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [address, isConnected, isSepolia, mode, cfg.poolId]);

  if (!isConnected || !isSepolia) {
    return (
      <div className="text-sm text-slate-500 py-4 text-center">
        Connect wallet and switch to Sepolia to view hook checks
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-slate-500 py-4 text-center">
        Loading events...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-8 text-center">
        No hook checks yet — go to Trade and run a check.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-slate-600">
            <th className="text-left py-2">Time</th>
            <th className="text-left py-2">Market</th>
            <th className="text-left py-2">Result</th>
            <th className="text-left py-2">Reason</th>
            <th className="text-left py-2">Tx</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => {
            const timeAgo = "Just now"; // In production, calculate from block timestamp
            return (
              <tr key={index} className="border-b">
                <td className="py-3 text-slate-600">{timeAgo}</td>
                <td className="py-3 font-medium">gGOLD</td>
                <td className="py-3">
                  {event.args.eligible ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Eligible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      Not Eligible
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="text-slate-700">
                    Code: {event.args.reasonCode}
                  </div>
                  <div className="text-xs text-slate-500">
                    {reasonText[event.args.reasonCode] || "Unknown"}
                  </div>
                </td>
                <td className="py-3">
                  <a
                    href={`https://${mode === "demo" ? "sepolia." : ""}etherscan.io/tx/${event.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
