/**
 * For local dev / unit tests:
 * - ciphertext = abi.encode(uint256 bitmap)
 *
 * For Zama:
 * - replace this with fhevmjs encryption to produce ciphertext bytes
 *   and store those bytes onchain.
 */
import { ethers } from "ethers";

export async function encryptBitmap(bitmap: bigint): Promise<`0x${string}`> {
  // TODO: integrate fhevmjs here for real Zama encryption.
  // Fallback:
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [bitmap]);
  return encoded as `0x${string}`;
}
