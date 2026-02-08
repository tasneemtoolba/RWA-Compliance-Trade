// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IComplianceStoreFHE {
    struct Profile {
        bytes encryptedJurisdiction;
        bytes encryptedAccredited;
        bytes encryptedLimit;
        uint64 expiry;
        address issuer;
        bool revoked;
        bool exists;
    }

    function storeProfile(
        address user,
        bytes calldata encJur,
        bytes calldata encAccred,
        bytes calldata encLimit,
        uint64 expiry,
        uint256 productId
    ) external;

    function isEligible(
        address user,
        uint256 productId,
        uint256 notional
    ) external view returns (bool eligible, uint8 reason);

    function revokeProfile(address user) external;

    function getProfile(address user) external view returns (Profile memory);

    function allowIssuer(uint256 productId, address issuer) external;

    function disallowIssuer(uint256 productId, address issuer) external;
}
