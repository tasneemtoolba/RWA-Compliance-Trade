/**
 * Route Store - Client-side storage for last executed route
 * Uses localStorage for persistence
 */

"use client";

import { useState, useEffect } from "react";
import type { RouteExecutionResult } from "@/lib/lifi/types";

const STORAGE_KEY = "cloakswap-route-store";

export function useRouteStore() {
  const [lastRoute, setLastRouteState] = useState<RouteExecutionResult | null>(null);
  
  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setLastRouteState(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load stored route:", e);
      }
    }
  }, []);
  
  const setLastRoute = (route: RouteExecutionResult) => {
    setLastRouteState(route);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(route));
      } catch (e) {
        console.error("Failed to save route:", e);
      }
    }
  };
  
  const clearLastRoute = () => {
    setLastRouteState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
  
  return {
    lastRoute,
    setLastRoute,
    clearLastRoute,
  };
}
