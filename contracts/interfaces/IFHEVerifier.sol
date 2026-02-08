// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFHEVerifier {
    function verify(bytes calldata encryptedUserBitmapCiphertext, uint256 ruleMask) external view returns (bool eligible);
    function verifyBytes32(bytes32 encryptedUserHash, uint256 ruleMask) external view returns (bool eligible);
}
