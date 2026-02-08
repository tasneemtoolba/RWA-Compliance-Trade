import { createPublicClient, http, formatAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import { getEnsText, setEnsText } from "viem/actions";

export type Mode = "demo" | "production";

export const getChain = (mode: Mode) => {
    return mode === "demo" ? sepolia : mainnet;
};

/**
 * Resolve ENS name from address
 */
export async function resolveENS(
    address: string,
    mode: Mode = "demo"
): Promise<string | null> {
    try {
        const chain = getChain(mode);
        const client = createPublicClient({
            chain,
            transport: http(),
        });

        const name = await client.getEnsName({
            address: address as `0x${string}`,
        });

        return name || null;
    } catch (error) {
        console.error("Error resolving ENS:", error);
        return null;
    }
}

/**
 * Resolve address from ENS name
 */
export async function resolveAddress(
    ensName: string,
    mode: Mode = "demo"
): Promise<string | null> {
    try {
        const chain = getChain(mode);
        const client = createPublicClient({
            chain,
            transport: http(),
        });

        const address = await client.getEnsAddress({
            name: normalize(ensName),
        });

        return address || null;
    } catch (error) {
        console.error("Error resolving address:", error);
        return null;
    }
}

/**
 * Read ENS text record
 */
export async function readEnsText(
    ensName: string,
    key: string,
    mode: Mode = "demo"
): Promise<string | null> {
    try {
        const chain = getChain(mode);
        const client = createPublicClient({
            chain,
            transport: http(),
        });

        const value = await getEnsText(client, {
            name: normalize(ensName),
            key,
        });

        return value || null;
    } catch (error) {
        console.error("Error reading ENS text record:", error);
        return null;
    }
}

/**
 * Write ENS text record (requires wallet connection and ENS ownership)
 */
export async function writeEnsText(
    ensName: string,
    key: string,
    value: string,
    mode: Mode = "demo"
): Promise<string | null> {
    try {
        // Note: This requires wallet connection and ENS resolver contract interaction
        // In production, you'd use wagmi's useWriteContract with the ENS resolver ABI
        // For now, return a placeholder
        console.log(`Would write ENS text record: ${ensName} -> ${key} = ${value}`);
        return null;
    } catch (error) {
        console.error("Error writing ENS text record:", error);
        return null;
    }
}

/**
 * Format address with ENS name if available
 */
export function formatAddressWithENS(
    address: string,
    ensName: string | null
): string {
    if (ensName) {
        return `${ensName} (${formatAddress(address)})`;
    }
    return formatAddress(address);
}

/**
 * ENS text record keys for CloakSwap preferences
 */
export const ENS_KEYS = {
    DISPLAY_NAME: "cloakswap:displayName",
    PREFERRED_CHAIN: "cloakswap:preferredChain",
    PREFERRED_TOKEN: "cloakswap:preferredToken",
} as const;
