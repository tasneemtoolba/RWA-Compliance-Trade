// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUserRegistry {
    event ProfileSet(address indexed user, uint64 expiry);
    event ProfileCleared(address indexed user);
    event SelfRegistered(address indexed wallet, bytes32 indexed userId, uint64 expiry);
    event SelfProfileUpdated(address indexed wallet, bytes32 indexed userId, uint64 expiry);

    // Self-service functions (public)
    function selfRegister(bytes32 encryptedProfileBitMap, uint64 expiry) external;
    function selfUpdateProfile(bytes32 encryptedProfileBitMap, uint64 expiry) external;
    function getUserProfileByWallet(address wallet) external view returns (bytes32 encryptedProfileBitMap, uint64 expiry);

    // Owner-only functions
    function setEncryptedProfileFor(address user, bytes calldata ciphertext, uint64 expiry) external;
    function clearProfile(address user) external;

    // View functions
    function getEncryptedProfile(address user) external view returns (bytes memory ciphertext, uint64 expiry);
    function getUserIdByWallet(address wallet) external view returns (bytes32);
}
