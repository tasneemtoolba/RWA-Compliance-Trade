/**
 * For local dev / unit tests:
 * - bitmap → bytes32 (direct conversion for demo)
 *
 * For Zama:
 * - replace this with fhevmjs encryption to produce ciphertext bytes
 *   and store those bytes onchain.
 */

/**
 * Convert bitmap to bytes32 string (for demo)
 */
export function bitmapToBytes32(bitmap: bigint): `0x${string}` {
  // Pad to 64 hex characters (32 bytes)
  const hex = bitmap.toString(16).padStart(64, "0");
  return `0x${hex}` as `0x${string}`;
}

/**
 * Legacy function for compatibility (returns bytes, but we'll use bytes32 in new functions)
 */
export async function encryptBitmap(bitmap: bigint): Promise<`0x${string}`> {
  // For demo: just convert to bytes32
  return bitmapToBytes32(bitmap);
}
