// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceStoreFHE
 * @dev Stores encrypted eligibility fields per user address
 * For Demo Mode: stores encrypted jurisdiction, accredited flag, and max notional bucket
 */
contract ComplianceStoreFHE is Ownable {
    // Reason codes for eligibility failures
    uint8 public constant RULE_CREDENTIAL_MISSING = 1;
    uint8 public constant RULE_CREDENTIAL_EXPIRED = 2;
    uint8 public constant RULE_CREDENTIAL_REVOKED = 3;
    uint8 public constant RULE_ISSUER_NOT_ALLOWED = 4;
    uint8 public constant RULE_NOTIONAL_EXCEEDED = 5;
    uint8 public constant RULE_JURISDICTION_DENIED = 6;
    uint8 public constant RULE_NOT_ACCREDITED = 7;

    struct Profile {
        bytes encryptedJurisdiction; // FHE-encrypted jurisdiction code
        bytes encryptedAccredited; // FHE-encrypted accredited flag (ebool)
        bytes encryptedLimit; // FHE-encrypted max notional bucket
        uint64 expiry; // Unix timestamp when credential expires
        address issuer; // Address of the issuer who created this credential
        bool revoked; // Whether this credential has been revoked
        bool exists; // Whether this profile exists
    }

    // Mapping from user address to their encrypted profile
    mapping(address => Profile) public profiles;

    // Mapping from productId to allowed issuers
    mapping(uint256 => mapping(address => bool)) public allowedIssuers;

    // Events
    event ProfileStored(
        address indexed user,
        address indexed issuer,
        uint64 expiry,
        uint256 productId
    );
    event ProfileRevoked(address indexed user, address indexed issuer);
    event IssuerAllowed(uint256 indexed productId, address indexed issuer);
    event IssuerDisallowed(uint256 indexed productId, address indexed issuer);
    event EligibilityChecked(
        address indexed user,
        uint256 indexed productId,
        bool eligible,
        uint8 reason
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Store encrypted eligibility profile for a user
     * @param user Address of the user
     * @param encJur FHE-encrypted jurisdiction
     * @param encAccred FHE-encrypted accredited flag
     * @param encLimit FHE-encrypted max notional bucket
     * @param expiry Unix timestamp when credential expires
     * @param productId Product ID this credential is for
     */
    function storeProfile(
        address user,
        bytes calldata encJur,
        bytes calldata encAccred,
        bytes calldata encLimit,
        uint64 expiry,
        uint256 productId
    ) external {
        require(user != address(0), "Invalid user address");
        require(expiry > block.timestamp, "Expiry must be in the future");
        require(allowedIssuers[productId][msg.sender], "Issuer not allowed");

        profiles[user] = Profile({
            encryptedJurisdiction: encJur,
            encryptedAccredited: encAccred,
            encryptedLimit: encLimit,
            expiry: expiry,
            issuer: msg.sender,
            revoked: false,
            exists: true
        });

        emit ProfileStored(user, msg.sender, expiry, productId);
    }

    /**
     * @dev Check if a user is eligible for a swap
     * @param user Address of the user
     * @param productId Product ID to check eligibility for
     * @param notional Notional value of the swap (in smallest unit, e.g., wei)
     * @return eligible Whether the user is eligible
     * @return reason Reason code if not eligible (0 if eligible)
     */
    function isEligible(
        address user,
        uint256 productId,
        uint256 notional
    ) external view returns (bool eligible, uint8 reason) {
        Profile memory profile = profiles[user];

        // Check if credential exists
        if (!profile.exists) {
            return (false, RULE_CREDENTIAL_MISSING);
        }

        // Check if credential is revoked
        if (profile.revoked) {
            return (false, RULE_CREDENTIAL_REVOKED);
        }

        // Check if credential is expired
        if (profile.expiry < block.timestamp) {
            return (false, RULE_CREDENTIAL_EXPIRED);
        }

        // Check if issuer is allowed for this product
        if (!allowedIssuers[productId][profile.issuer]) {
            return (false, RULE_ISSUER_NOT_ALLOWED);
        }

        // For demo purposes, we'll do simplified checks
        // In production, these would use FHE operations to compare encrypted values
        // For now, we'll assume the encrypted data contains valid values
        // and do basic notional check (this is a placeholder - real FHE comparison needed)

        // Note: In a real FHE implementation, you would:
        // 1. Decrypt and compare encryptedJurisdiction against allowed jurisdictions
        // 2. Decrypt and check encryptedAccredited flag
        // 3. Decrypt and compare notional <= encryptedLimit using FHE operations
        // For demo, we'll return eligible if all basic checks pass
        // The actual FHE verification would happen off-chain or via a verifier contract

        // Placeholder: assume eligible if basic checks pass
        // In production, integrate with FHE verifier contract
        eligible = true;
        reason = 0;
    }

    /**
     * @dev Revoke a user's credential
     * @param user Address of the user whose credential to revoke
     */
    function revokeProfile(address user) external {
        Profile storage profile = profiles[user];
        require(profile.exists, "Profile does not exist");
        require(
            profile.issuer == msg.sender || msg.sender == owner(),
            "Not authorized to revoke"
        );

        profile.revoked = true;
        emit ProfileRevoked(user, profile.issuer);
    }

    /**
     * @dev Allow an issuer for a product
     * @param productId Product ID
     * @param issuer Address of the issuer
     */
    function allowIssuer(uint256 productId, address issuer) external onlyOwner {
        allowedIssuers[productId][issuer] = true;
        emit IssuerAllowed(productId, issuer);
    }

    /**
     * @dev Disallow an issuer for a product
     * @param productId Product ID
     * @param issuer Address of the issuer
     */
    function disallowIssuer(
        uint256 productId,
        address issuer
    ) external onlyOwner {
        allowedIssuers[productId][issuer] = false;
        emit IssuerDisallowed(productId, issuer);
    }

    /**
     * @dev Get a user's profile
     * @param user Address of the user
     * @return profile The user's profile
     */
    function getProfile(
        address user
    ) external view returns (Profile memory profile) {
        return profiles[user];
    }
}
