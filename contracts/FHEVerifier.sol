// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFHEVerifier.sol";

/**
 * MVP verifier.
 * Predicate: eligible ⇔ (userBitmap & ruleMask) == ruleMask
 *
 * DEV FALLBACK:
 * - Treat ciphertext as abi.encode(uint256 plaintextBitmap) for local tests / demo scaffolding.
 * - Replace `_decodeBitmapFallback` with real fhEVM TFHE operations for Sepolia when available.
 */
contract FHEVerifier is IFHEVerifier {
    function verify(bytes calldata encryptedUserBitmapCiphertext, uint256 ruleMask) external pure returns (bool eligible) {
        if (encryptedUserBitmapCiphertext.length == 0) return false;
        if (ruleMask == 0) return false;

        uint256 userBitmap = _decodeBitmapFallback(encryptedUserBitmapCiphertext);
        return (userBitmap & ruleMask) == ruleMask;
    }

    function _decodeBitmapFallback(bytes calldata ciphertext) internal pure returns (uint256 bitmap) {
        // expects ciphertext = abi.encode(uint256 bitmap)
        // If ciphertext is real Zama ciphertext, this will revert or decode garbage; replace with TFHE.
        require(ciphertext.length >= 32, "Ciphertext too short");
        bitmap = abi.decode(ciphertext, (uint256));
    }
}
