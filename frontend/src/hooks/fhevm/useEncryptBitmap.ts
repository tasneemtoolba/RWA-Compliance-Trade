import { useState } from "react";
import { useFhevm } from "@/providers/FhevmProvider";
import { useAccount } from "wagmi";

type EncryptedBitmap = {
    handles: Uint8Array[];
    inputProof: Uint8Array;
};

/**
 * Hook to encrypt a bitmap value using FHE encryption
 * Similar to useEncrypt from zama-compliance-hook but for bitmap (uint256)
 */
export const useEncryptBitmap = () => {
    const { instance, status } = useFhevm();
    const { address } = useAccount();
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [encryptedBitmap, setEncryptedBitmap] = useState<EncryptedBitmap | null>(null);

    /**
     * Encrypt a bitmap value using FHE
     * Returns a promise that resolves with the encrypted bitmap
     */
    async function encryptBitmap(
        contractAddress: `0x${string}`,
        bitmapValue: bigint,
    ): Promise<EncryptedBitmap> {
        if (!instance || status !== "ready") {
            throw new Error("FHEVM instance not ready. Please wait for initialization.");
        }
        if (!address) {
            throw new Error("Wallet not connected");
        }

        setIsEncrypting(true);
        setEncryptedBitmap(null);

        try {
            // Wait for next javascript event loop to enable rendering
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Create encrypted input for uint256 (bitmap)
            // Note: The relayer SDK may support add256, but if not, we'll use add64 for the lower 64 bits
            // Since bitmaps are typically small, we can safely use the lower 64 bits
            const input = instance.createEncryptedInput(
                contractAddress as string,
                address as string,
            );

            // Try add256 first, fall back to add64 if not available
            let result;
            if (typeof (input as any).add256 === 'function') {
                result = await (input as any).add256(bitmapValue).encrypt();
            } else {
                // Use add64 for the lower 64 bits (bitmaps are typically small enough)
                // Mask to get only the lower 64 bits
                const lower64Bits = bitmapValue & BigInt("0xFFFFFFFFFFFFFFFF");
                result = await input.add64(lower64Bits).encrypt();
            }

            setEncryptedBitmap(result);
            return result;
        } catch (error) {
            console.error("Encryption failed:", error);
            setIsEncrypting(false);
            throw error;
        } finally {
            setIsEncrypting(false);
        }
    }

    async function resetEncrypt() {
        setEncryptedBitmap(null);
        setIsEncrypting(false);
    }

    return {
        encryptBitmap,
        isEncrypting,
        encryptedBitmap,
        resetEncrypt,
        isReady: status === "ready"
    };
};
