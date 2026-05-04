/**
 * For local dev / unit tests:
 * - bitmap → bytes32 (direct conversion for demo)
 *
 * For Zama:
 * - Use the relayer SDK's createEncryptedInput() to produce encrypted handles
 *   and store those handles onchain using FHE types (euint64, etc.)
 */

import { toHexString } from "./helper";

/**
 * Convert bitmap to bytes32 string (for demo)
 */
export function bitmapToBytes32(bitmap: bigint): `0x${string}` {
  // Pad to 64 hex characters (32 bytes)
  const hex = bitmap.toString(16).padStart(64, "0");
  return `0x${hex}` as `0x${string}`;
}

/**
 * Convert encrypted FHE handles to bytes32 format for onchain storage
 * This is used when storing FHE-encrypted data onchain
 */
export function encryptedHandlesToBytes32(
  handles: Uint8Array[]
): `0x${string}` {
  if (!handles || handles.length === 0) {
    throw new Error("No encrypted handles provided");
  }
  // Convert the first handle (the encrypted value) to bytes32 hex string
  // This matches the pattern from zama-compliance-hook
  return toHexString(handles[0]) as `0x${string}`;
}

/**
 * Legacy function for compatibility (returns bytes, but we'll use bytes32 in new functions)
 */
export async function encryptBitmap(bitmap: bigint): Promise<`0x${string}`> {
  // For demo: just convert to bytes32
  return bitmapToBytes32(bitmap);
}
