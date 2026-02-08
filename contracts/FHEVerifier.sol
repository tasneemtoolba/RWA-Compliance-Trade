// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFHEVerifier.sol";

/**
 * MVP verifier.
 * Predicate: eligible ⇔ (userBitmap & ruleMask) == ruleMask
 *
 * For demo: treats bytes32 as uint256 bitmap directly.
 * For production: replace with real fhEVM TFHE operations.
 */
contract FHEVerifier is IFHEVerifier {
    function verify(bytes calldata encryptedUserBitmapCiphertext, uint256 ruleMask) external pure returns (bool eligible) {
        if (encryptedUserBitmapCiphertext.length == 0) return false;
        if (ruleMask == 0) return false;

        // For demo: decode first 32 bytes as uint256 bitmap
        // For production: use TFHE operations on encrypted data
        uint256 userBitmap = _decodeBitmapFallback(encryptedUserBitmapCiphertext);
        return (userBitmap & ruleMask) == ruleMask;
    }

    /**
     * Alternative verify function that accepts bytes32 directly (for demo simplicity)
     */
    function verifyBytes32(bytes32 encryptedUserHash, uint256 ruleMask) external pure returns (bool eligible) {
        if (ruleMask == 0) return false;
        uint256 userBitmap = uint256(encryptedUserHash);
        return (userBitmap & ruleMask) == ruleMask;
    }

    function _decodeBitmapFallback(bytes calldata ciphertext) internal pure returns (uint256 bitmap) {
        // expects ciphertext = abi.encode(uint256 bitmap) or bytes32
        require(ciphertext.length >= 32, "Ciphertext too short");
        // Take first 32 bytes as uint256
        assembly {
            bitmap := calldataload(ciphertext.offset)
        }
    }
}
