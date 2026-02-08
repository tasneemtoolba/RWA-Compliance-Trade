/**
 * Mock FHE Encryption
 * For demo: encodes eligibility to bitmap, "encrypts" to bytes32
 */

import type { Region, Bucket } from "@/lib/bitmap";

export interface EligibilityInput {
  region: Region;
  accredited: boolean;
  bucket: Bucket;
}

/**
 * Encode eligibility attributes to bitmap
 * Bit layout:
 * bit 0 = accredited
 * bit 1 = region EU
 * bit 2 = region US
 * bit 3 = bucket >= 1000
 * bit 4 = bucket >= 10000
 */
export function encodeEligibilityToBitmap(input: EligibilityInput): bigint {
  let bitmap = 0n;
  
  if (input.accredited) {
    bitmap |= 1n << 0n;
  }
  
  if (input.region === "EU") {
    bitmap |= 1n << 1n;
  } else if (input.region === "US") {
    bitmap |= 1n << 2n;
  }
  
  const bucketNum = parseInt(input.bucket);
  if (bucketNum >= 1000) {
    bitmap |= 1n << 3n;
  }
  if (bucketNum >= 10000) {
    bitmap |= 1n << 4n;
  }
  
  return bitmap;
}

/**
 * "Encrypt" bitmap to bytes32 string
 * For demo: just convert to hex, for production: real FHE encryption
 */
export function encryptBitmap(bitmap: bigint): string {
  // Convert to bytes32 hex string
  const hex = bitmap.toString(16).padStart(64, "0");
  return `0x${hex}`;
}

/**
 * Decrypt is not allowed in UI - only show form inputs + ciphertext preview
 * This function exists for type safety but should never be called
 */
export function decryptBitmap(_ciphertext: string): never {
  throw new Error("Decryption not allowed - privacy preserved");
}
