// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUserRegistry.sol";
import "./interfaces/IFHEVerifier.sol";

contract ComplianceHook is Ownable {
    error NotVerified();
    error CredentialExpired();
    error PoolNotConfigured();
    error NotEligible();

    event ComplianceCheck(address indexed user, bytes32 indexed poolId, bool eligible, uint8 reasonCode);

    // reason codes
    uint8 public constant OK = 0;
    uint8 public constant NO_CREDENTIAL = 1;
    uint8 public constant EXPIRED = 2;
    uint8 public constant NOT_ELIGIBLE = 3;
    uint8 public constant POOL_NOT_CONFIGURED = 4;

    IUserRegistry public immutable userRegistry;
    IFHEVerifier public immutable verifier;

    // For MVP: poolId => rule mask
    mapping(bytes32 => uint256) public poolRuleMask;

    constructor(address initialOwner, address _userRegistry, address _verifier) Ownable(initialOwner) {
        userRegistry = IUserRegistry(_userRegistry);
        verifier = IFHEVerifier(_verifier);
    }

    function setPoolRuleMask(bytes32 poolId, uint256 ruleMask) external onlyOwner {
        require(ruleMask != 0, "ruleMask=0");
        poolRuleMask[poolId] = ruleMask;
    }

    /**
     * Frontend-friendly check function (works even without PoolManager harness).
     */
    function check(address user, bytes32 poolId) external view returns (bool eligible, uint8 reasonCode) {
        uint256 ruleMask = poolRuleMask[poolId];
        if (ruleMask == 0) return (false, POOL_NOT_CONFIGURED);

        (bytes memory ciphertext, uint64 expiry) = userRegistry.getEncryptedProfile(user);
        if (ciphertext.length == 0) return (false, NO_CREDENTIAL);
        if (expiry < uint64(block.timestamp)) return (false, EXPIRED);

        bool ok = verifier.verify(ciphertext, ruleMask);
        if (!ok) return (false, NOT_ELIGIBLE);

        return (true, OK);
    }

    /**
     * Hook entrypoint (pseudo).
     * Replace this with your real Uniswap v4 Hook callback signature and call _enforce(user,poolId).
     */
    function beforeSwap(address user, bytes32 poolId) external view {
        _enforce(user, poolId);
    }

    function _enforce(address user, bytes32 poolId) internal view {
        (bool eligible, uint8 reason) = this.check(user, poolId);
        // emit in non-view hook in production; kept simple here.
        // In real hook, emit event and revert based on reason.
        if (!eligible) {
            if (reason == NO_CREDENTIAL) revert NotVerified();
            if (reason == EXPIRED) revert CredentialExpired();
            if (reason == POOL_NOT_CONFIGURED) revert PoolNotConfigured();
            revert NotEligible();
        }
    }
}
