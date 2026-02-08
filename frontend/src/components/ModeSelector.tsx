"use client";

import { useMode } from "@/hooks/useMode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";

export function ModeSelector() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center gap-2">
      <Network className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Mode:</span>
      <div className="flex gap-1 bg-muted rounded-md p-1">
        <Button
          variant={mode === "demo" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("demo")}
          className="h-7"
        >
          Demo
          {mode === "demo" && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Sepolia
            </Badge>
          )}
        </Button>
        <Button
          variant={mode === "production" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("production")}
          className="h-7"
        >
          Production
          {mode === "production" && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Mainnet
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
