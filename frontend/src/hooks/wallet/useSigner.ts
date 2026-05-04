import { useState, useEffect } from "react";
import { Signer } from "ethers";
import { clientToSigner } from "@/lib/wagmi-adapter/client-to-signer";
import { useWalletClient } from "wagmi";

export function useSigner() {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<Signer | null>(null);

  useEffect(() => {
    const initSigner = async () => {
      try {
        if (!walletClient) {
          setSigner(null);
          return;
        }
        const s = clientToSigner(walletClient);
        setSigner(s);
      } catch (error) {
        console.error("Error initializing signer:", error);
        setSigner(null);
      }
    };
    initSigner();
  }, [walletClient]);

  return { signer };
}
