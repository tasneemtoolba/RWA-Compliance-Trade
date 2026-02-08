"use client";

import { useState, useEffect } from "react";

export type Mode = "demo" | "production";

const MODE_STORAGE_KEY = "cloakswap-mode";

export function useMode() {
  const [mode, setMode] = useState<Mode>("demo");

  useEffect(() => {
    // Load mode from localStorage
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "demo" || stored === "production") {
      setMode(stored);
    }
  }, []);

  const updateMode = (newMode: Mode) => {
    setMode(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  };

  return { mode, setMode: updateMode };
}
