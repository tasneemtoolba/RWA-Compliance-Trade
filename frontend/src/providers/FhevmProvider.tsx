import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useFhevm as useFhevmHook } from "@/hooks/fhevm/useFhevm";
import { useWalletClient } from "wagmi";

interface FhevmContextType {
  instance: ReturnType<typeof useFhevmHook>["instance"];
  status: ReturnType<typeof useFhevmHook>["status"];
  error: ReturnType<typeof useFhevmHook>["error"];
  refresh: ReturnType<typeof useFhevmHook>["refresh"];
}

export const FhevmContext = createContext<FhevmContextType | undefined>(
  undefined
);

export function FhevmProvider({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();
  const provider = walletClient?.account ? (window.ethereum as any) : undefined;
  const chainId = walletClient?.chain?.id;
  
  const { instance, status, error, refresh } = useFhevmHook({
    provider,
    chainId,
    enabled: !!walletClient,
  });

  return (
    <FhevmContext.Provider value={{ instance, status, error, refresh }}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (context === undefined) {
    throw new Error("useFhevm must be used within a FhevmProvider");
  }
  return context;
}
