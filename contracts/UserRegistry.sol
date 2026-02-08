// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUserRegistry.sol";

contract UserRegistry is IUserRegistry, Ownable {
    struct Profile {
        bytes32 encryptedProfileBitMap; // encrypted bitmap (bytes32 for demo, can be bytes for real FHE)
        uint64 expiry;                  // unix seconds
        bool exists;
    }

    mapping(address => Profile) private profiles;
    mapping(address => bytes32) private _walletToUserId;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Self-service registration (public, not onlyOwner)
    function selfRegister(bytes32 encryptedProfileBitMap, uint64 expiry) external {
        require(_walletToUserId[msg.sender] == bytes32(0), "Already registered");
        require(expiry > uint64(block.timestamp), "Expiry in past");

        bytes32 userId = keccak256(abi.encodePacked(msg.sender));
        _walletToUserId[msg.sender] = userId;

        profiles[msg.sender] = Profile({
            encryptedProfileBitMap: encryptedProfileBitMap,
            expiry: expiry,
            exists: true
        });

        emit SelfRegistered(msg.sender, userId, expiry);
    }

    // Self-service profile update (public, not onlyOwner)
    function selfUpdateProfile(bytes32 encryptedProfileBitMap, uint64 expiry) external {
        bytes32 userId = _walletToUserId[msg.sender];
        require(userId != bytes32(0) && profiles[msg.sender].exists, "Not registered");
        require(expiry > uint64(block.timestamp), "Expiry in past");

        profiles[msg.sender].encryptedProfileBitMap = encryptedProfileBitMap;
        profiles[msg.sender].expiry = expiry;
        emit SelfProfileUpdated(msg.sender, userId, expiry);
    }

    // Get profile by wallet (simplifies UI reads)
    function getUserProfileByWallet(address wallet) external view returns (bytes32 encryptedProfileBitMap, uint64 expiry) {
        Profile storage p = profiles[wallet];
        require(p.exists, "Wallet not registered");
        return (p.encryptedProfileBitMap, p.expiry);
    }

    // Legacy function for compatibility (maps to new structure)
    function setMyEncryptedProfile(bytes calldata ciphertext, uint64 expiry) external {
        require(ciphertext.length >= 32, "Ciphertext too short");
        // Extract first 32 bytes as bytes32
        bytes32 bitmap;
        assembly {
            bitmap := calldataload(ciphertext.offset)
        }
        if (profiles[msg.sender].exists) {
            selfUpdateProfile(bitmap, expiry);
        } else {
            selfRegister(bitmap, expiry);
        }
    }

    // Owner-only functions (for admin)
    function setEncryptedProfileFor(address user, bytes calldata ciphertext, uint64 expiry) external onlyOwner {
        require(ciphertext.length >= 32, "Ciphertext too short");
        // Extract first 32 bytes as bytes32
        bytes32 bitmap;
        assembly {
            bitmap := calldataload(ciphertext.offset)
        }
        if (!profiles[user].exists) {
            bytes32 userId = keccak256(abi.encodePacked(user));
            _walletToUserId[user] = userId;
            profiles[user] = Profile({
                encryptedProfileBitMap: bitmap,
                expiry: expiry,
                exists: true
            });
            emit SelfRegistered(user, userId, expiry);
        } else {
            profiles[user].encryptedProfileBitMap = bitmap;
            profiles[user].expiry = expiry;
            emit SelfProfileUpdated(user, _walletToUserId[user], expiry);
        }
    }

    function clearProfile(address user) external {
        require(msg.sender == user || msg.sender == owner(), "Not authorized");
        delete profiles[user];
        _walletToUserId[user] = bytes32(0);
        emit ProfileCleared(user);
    }

    // Legacy getter (for hook compatibility)
    function getEncryptedProfile(address user) external view returns (bytes memory ciphertext, uint64 expiry) {
        Profile storage p = profiles[user];
        if (!p.exists) return ("", 0);
        // Convert bytes32 to bytes for compatibility
        ciphertext = abi.encodePacked(p.encryptedProfileBitMap);
        return (ciphertext, p.expiry);
    }

    function getUserIdByWallet(address wallet) external view returns (bytes32) {
        return _walletToUserId[wallet];
    }
} 
