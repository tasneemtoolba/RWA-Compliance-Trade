import { useState } from "react";
import { reencryptEuint64 } from "@/lib/fhevm/reencrypt";
import { Signer } from "ethers";
import { useFhevm } from "@/providers/FhevmProvider";

interface useDecryptValueProps {
  signer: Signer | null;
}

export const useDecryptValue = ({ signer }: useDecryptValueProps) => {
  const [decryptedValue, setDecryptedValue] = useState<bigint | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Never");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { instance, status } = useFhevm();

  const decrypt = async (handle: bigint, contractAddress: `0x${string}`) => {
    setIsDecrypting(true);
    setError(null);
    try {
      if (!signer)
        throw new Error("Signer not initialized - please connect your wallet");
      if (!instance) throw new Error("FHEVM instance not initialized");
      if (status !== "ready")
        throw new Error("FHEVM instance not ready");
      if (!handle || handle === 0n) {
        setDecryptedValue(0n);
        setLastUpdated(new Date().toLocaleString());
        return;
      }

      // Note this only works for values which are euint64
      // TODO: make hook more universal
      const clearBalance = await reencryptEuint64(
        signer,
        instance,
        BigInt(handle),
        contractAddress,
      );

      setDecryptedValue(clearBalance);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Decryption error:", error);
      if (error === "Handle is not initialized") {
        setDecryptedValue(0n);
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to decrypt balance",
        );
        throw error;
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  return {
    decryptedValue,
    lastUpdated,
    isDecrypting,
    decrypt,
    error,
  };
};
