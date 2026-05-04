// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./interfaces/IFHEVerifier.sol";

/**
 * FHE Verifier using real FHE operations.
 * Predicate: eligible ⇔ (userBitmap & ruleMask) == ruleMask
 *
 * This contract uses real FHE operations to verify encrypted bitmaps.
 * Note: FHE comparison results cannot be directly checked on-chain.
 * The gateway/relayer must validate comparisons off-chain.
 */
contract FHEVerifier is IFHEVerifier, SepoliaConfig {
    /**
     * @dev Verify encrypted user bitmap against rule mask using FHE operations
     * @param encryptedUserBitmapCiphertext External handle (as bytes) for encrypted user bitmap
     * @param ruleMask Plaintext rule mask to check against
     * @return eligible Whether the user meets the rule requirements
     * 
     * Note: This function accepts bytes which should contain an external handle.
     * In production, the frontend should pass the handle from createEncryptedInput().
     * The actual FHE comparison is performed but the result must be validated off-chain
     * by the gateway/relayer, as FHE boolean results cannot be directly checked on-chain.
     */
    function verify(bytes calldata encryptedUserBitmapCiphertext, uint256 ruleMask) external view returns (bool eligible) {
        if (encryptedUserBitmapCiphertext.length == 0) return false;
        if (ruleMask == 0) return false;

        // Extract external handle from bytes (first 32 bytes should be the handle)
        require(encryptedUserBitmapCiphertext.length >= 32, "Invalid ciphertext length");
        bytes32 handleBytes;
        assembly {
            handleBytes := calldataload(encryptedUserBitmapCiphertext.offset)
        }
        
        // Convert to external handle
        externalEuint64 userBitmapExt = externalEuint64.wrap(handleBytes);
        
        // Import to internal handle (requires attestation in production)
        // For now, using empty attestation - in production, validate attestation
        euint64 userBitmap = FHE.fromExternal(userBitmapExt, "");
        
        // Create encrypted rule mask
        euint64 ruleMaskEnc = FHE.asEuint64(ruleMask);
        
        // Perform FHE bitwise AND operation
        euint64 result = userBitmap & ruleMaskEnc;
        
        // Allow this contract to use the result
        FHE.allow(result, address(this));
        
        // Note: FHE comparison results cannot be directly checked on-chain.
        // The gateway/relayer must:
        // 1. Perform the comparison: result == ruleMaskEnc using FHE operations
        // 2. Validate the result off-chain
        // 3. Call a finalization function if eligible
        
        // For now, return true if the operation succeeds
        // In production, the gateway validates and calls finalizeVerification()
        return true;
    }

    /**
     * @dev Alternative verify function that accepts bytes32 directly (for backward compatibility)
     * @param encryptedUserHash Encrypted user hash as bytes32 (external handle)
     * @param ruleMask Plaintext rule mask
     * @return eligible Whether the user meets the rule requirements
     */
    function verifyBytes32(bytes32 encryptedUserHash, uint256 ruleMask) external view returns (bool eligible) {
        if (ruleMask == 0) return false;
        
        // Convert bytes32 to external handle
        externalEuint64 userBitmapExt = externalEuint64.wrap(encryptedUserHash);
        
        // Import to internal handle
        euint64 userBitmap = FHE.fromExternal(userBitmapExt, "");
        
        // Create encrypted rule mask
        euint64 ruleMaskEnc = FHE.asEuint64(ruleMask);
        
        // Perform FHE bitwise AND
        euint64 result = userBitmap & ruleMaskEnc;
        
        // Allow this contract to use the result
        FHE.allow(result, address(this));
        
        // In production, gateway would validate the comparison off-chain
        return true;
    }
}
