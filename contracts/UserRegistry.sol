// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUserRegistry.sol";

contract UserRegistry is IUserRegistry, Ownable {
    struct Profile {
        bytes ciphertext; // encrypted bitmap ciphertext (opaque)
        uint64 expiry;    // unix seconds
        bool exists;
    }

    mapping(address => Profile) private profiles;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setMyEncryptedProfile(bytes calldata ciphertext, uint64 expiry) external {
        _setProfile(msg.sender, ciphertext, expiry);
    }

    function setEncryptedProfileFor(address user, bytes calldata ciphertext, uint64 expiry) external onlyOwner {
        _setProfile(user, ciphertext, expiry);
    }

    function clearProfile(address user) external {
        // allow user to clear their own; owner can clear anyone
        require(msg.sender == user || msg.sender == owner(), "Not authorized");
        delete profiles[user];
        emit ProfileCleared(user);
    }

    function getEncryptedProfile(address user) external view returns (bytes memory ciphertext, uint64 expiry) {
        Profile storage p = profiles[user];
        if (!p.exists) return ("", 0);
        return (p.ciphertext, p.expiry);
    }

    function getUserIdByWallet(address wallet) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(wallet));
    }

    function _setProfile(address user, bytes calldata ciphertext, uint64 expiry) internal {
        require(ciphertext.length > 0, "Empty ciphertext");
        require(expiry > uint64(block.timestamp), "Expiry must be future");

        profiles[user] = Profile({
            ciphertext: ciphertext,
            expiry: expiry,
            exists: true
        });

        emit ProfileSet(user, expiry);
    }
}
