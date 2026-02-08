// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUserRegistry {
    event ProfileSet(address indexed user, uint64 expiry);
    event ProfileCleared(address indexed user);

    function setMyEncryptedProfile(bytes calldata ciphertext, uint64 expiry) external;
    function setEncryptedProfileFor(address user, bytes calldata ciphertext, uint64 expiry) external;
    function clearProfile(address user) external;

    function getEncryptedProfile(address user) external view returns (bytes memory ciphertext, uint64 expiry);

    // Kept for compatibility with your older hook pattern
    function getUserIdByWallet(address wallet) external view returns (bytes32);
}
