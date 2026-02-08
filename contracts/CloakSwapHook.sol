// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {SwapParams} from "v4-core/types/PoolOperation.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolId} from "v4-core/types/PoolId.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {ComplianceStoreFHE} from "./ComplianceStoreFHE.sol";
import {ProductConfig} from "./ProductConfig.sol";

/**
 * @title CloakSwapHook
 * @dev Uniswap v4 hook that enforces compliance gating before swaps
 */
contract CloakSwapHook is BaseHook {
    ComplianceStoreFHE public immutable complianceStore;
    ProductConfig public immutable productConfig;

    // Mapping from pool to product ID
    mapping(PoolId => uint256) public poolToProduct;

    // Events
    event EligibilityCheck(
        address indexed user,
        PoolId indexed poolId,
        uint256 indexed productId,
        bool eligible,
        uint8 reason
    );
    event PoolProductSet(PoolId indexed poolId, uint256 indexed productId);

    // Errors
    error EligibilityFailed(uint8 reason);
    error ProductNotConfigured();

    constructor(
        IPoolManager _manager,
        ComplianceStoreFHE _complianceStore,
        ProductConfig _productConfig
    ) BaseHook(_manager) {
        complianceStore = _complianceStore;
        productConfig = _productConfig;
    }

    // BaseHook Functions
    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeAddLiquidity: false,
                afterAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: true, // We enforce compliance before swap
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }

    /**
     * @dev Hook called before a swap executes
     * @param sender Address initiating the swap
     * @param key Pool key
     * @param params Swap parameters
     * @param hookData Additional hook data
     * @return selector Function selector
     * @return delta Balance delta (0 for beforeSwap)
     */
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4 selector, int128 delta) {
        // Skip compliance check if swap is from this contract
        if (sender == address(this)) {
            return (this.beforeSwap.selector, 0);
        }

        PoolId poolId = key.toId();
        uint256 productId = poolToProduct[poolId];

        // Check if product is configured for this pool
        if (productId == 0) {
            revert ProductNotConfigured();
        }

        // Calculate notional value (simplified: use amount specified)
        // In production, this would calculate actual notional based on swap amount and price
        uint256 notional = params.amountSpecified > 0
            ? uint256(params.amountSpecified)
            : uint256(-params.amountSpecified);

        // Check eligibility
        (bool eligible, uint8 reason) = complianceStore.isEligible(
            sender,
            productId,
            notional
        );

        // Emit event for audit trail
        emit EligibilityCheck(sender, poolId, productId, eligible, reason);

        if (!eligible) {
            revert EligibilityFailed(reason);
        }

        return (this.beforeSwap.selector, 0);
    }

    /**
     * @dev Set the product ID for a pool
     * @param poolId Pool ID
     * @param productId Product ID
     */
    function setPoolProduct(PoolId poolId, uint256 productId) external {
        // Only allow owner or pool creator to set
        require(msg.sender == owner(), "Not authorized");
        require(
            productConfig.productExists(productId),
            "Product does not exist"
        );

        poolToProduct[poolId] = productId;
        emit PoolProductSet(poolId, productId);
    }

    /**
     * @dev Set the product ID for a pool using pool key
     * @param key Pool key
     * @param productId Product ID
     */
    function setPoolProductByKey(
        PoolKey calldata key,
        uint256 productId
    ) external {
        setPoolProduct(key.toId(), productId);
    }

    /**
     * @dev Get product ID for a pool
     * @param poolId Pool ID
     * @return productId Product ID
     */
    function getPoolProduct(PoolId poolId) external view returns (uint256) {
        return poolToProduct[poolId];
    }
}
