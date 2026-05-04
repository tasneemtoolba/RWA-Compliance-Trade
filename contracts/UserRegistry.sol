// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUserRegistry.sol";

contract UserRegistry is IUserRegistry, Ownable {
    struct Profile {
        bytes ciphertext; // encrypted bitmap ciphertext (opaque, supports real FHE)
        uint64 expiry;   // unix seconds
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

        // Convert bytes32 to bytes for storage (supports both demo and real FHE)
        profiles[msg.sender] = Profile({
            ciphertext: abi.encodePacked(encryptedProfileBitMap),
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

        profiles[msg.sender].ciphertext = abi.encodePacked(encryptedProfileBitMap);
        profiles[msg.sender].expiry = expiry;
        emit SelfProfileUpdated(msg.sender, userId, expiry);
    }

    // Get profile by wallet (simplifies UI reads)
    function getUserProfileByWallet(address wallet) external view returns (bytes32 encryptedProfileBitMap, uint64 expiry) {
        Profile storage p = profiles[wallet];
        require(p.exists, "Wallet not registered");
        // Convert bytes back to bytes32 for compatibility
        require(p.ciphertext.length >= 32, "Invalid ciphertext");
        assembly {
            encryptedProfileBitMap := mload(add(p.ciphertext, 32))
        }
        return (encryptedProfileBitMap, p.expiry);
    }

    // Main function for frontend (accepts bytes, supports real FHE ciphertexts)
    function setMyEncryptedProfile(bytes calldata ciphertext, uint64 expiry) external {
        require(ciphertext.length > 0, "Empty ciphertext");
        require(expiry > uint64(block.timestamp), "Expiry in past");

        bytes32 userId;
        if (!profiles[msg.sender].exists) {
            userId = keccak256(abi.encodePacked(msg.sender));
            _walletToUserId[msg.sender] = userId;
            emit SelfRegistered(msg.sender, userId, expiry);
        } else {
            userId = _walletToUserId[msg.sender];
            emit SelfProfileUpdated(msg.sender, userId, expiry);
        }

        profiles[msg.sender] = Profile({
            ciphertext: ciphertext,
            expiry: expiry,
            exists: true
        });

        emit ProfileSet(msg.sender, expiry);
    }

    // Owner-only functions (for admin)
    function setEncryptedProfileFor(address user, bytes calldata ciphertext, uint64 expiry) external onlyOwner {
        require(ciphertext.length > 0, "Empty ciphertext");
        require(expiry > uint64(block.timestamp), "Expiry in past");

        bytes32 userId;
        if (!profiles[user].exists) {
            userId = keccak256(abi.encodePacked(user));
            _walletToUserId[user] = userId;
            emit SelfRegistered(user, userId, expiry);
        } else {
            userId = _walletToUserId[user];
            emit SelfProfileUpdated(user, userId, expiry);
        }

        profiles[user] = Profile({
            ciphertext: ciphertext,
            expiry: expiry,
            exists: true
        });

        emit ProfileSet(user, expiry);
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
        // Return the stored ciphertext
        ciphertext = p.ciphertext;
        return (ciphertext, p.expiry);
    }

    function getUserIdByWallet(address wallet) external view returns (bytes32) {
        return _walletToUserId[wallet];
    }
} 
