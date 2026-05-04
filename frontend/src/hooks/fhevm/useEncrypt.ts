import { useState, useEffect } from "react";
import type { FhevmInstance } from "@/lib/fhevm/fhevmTypes";

type EncryptedAmount = {
  handles: bigint[];
  inputProof: Uint8Array;
};

export const useEncrypt = (instance: FhevmInstance | undefined) => {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedAmount, setEncryptedAmount] =
    useState<EncryptedAmount | null>(null);
  const [amount, setAmount] = useState<bigint>(0n);
  const [contractAddress, setContractAddress] = useState<`0x${string}` | null>(
    null,
  );
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null);

  useEffect(() => {
    if (!isEncrypting || !contractAddress || !userAddress || !instance) return;
    async function createEncryptedInput() {
      try {
        // wait for next javascript event loop to enable rendering
        await new Promise((resolve) => setTimeout(resolve, 0));
        
        // Use the correct createEncryptedInput API from relayer SDK
        const input = instance.createEncryptedInput(contractAddress, userAddress);
        input.add64(amount);
        const encrypted = await input.encrypt();

        const result: EncryptedAmount = {
          handles: encrypted.handles,
          inputProof: encrypted.inputProof,
        };

        setEncryptedAmount(result);
      } catch (error) {
        console.error("Encryption failed:", error);
        throw error;
      } finally {
        setIsEncrypting(false);
      }
    }
    createEncryptedInput();
  }, [isEncrypting, amount, contractAddress, userAddress, instance]);

  async function encryptAmount(
    contractAddress: `0x${string}`,
    userAddress: `0x${string}`,
    amount: bigint,
  ) {
    if (!instance) {
      throw new Error("FHEVM instance not available");
    }
    setContractAddress(contractAddress);
    setUserAddress(userAddress);
    setAmount(amount);
    setIsEncrypting(true);
  }

  async function resetEncrypt() {
    setEncryptedAmount(null);
    setIsEncrypting(false);
    setAmount(0n);
    setContractAddress(null);
    setUserAddress(null);
  }

  return { encryptAmount, isEncrypting, encryptedAmount, resetEncrypt };
};
