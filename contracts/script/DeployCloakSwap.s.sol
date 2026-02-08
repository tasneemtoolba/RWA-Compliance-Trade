// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {SwapParams, ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "v4-core/test/PoolSwapTest.sol";

import {CloakSwapHook} from "../CloakSwapHook.sol";
import {ComplianceStoreFHE} from "../ComplianceStoreFHE.sol";
import {ProductConfig} from "../ProductConfig.sol";

contract TestToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 10000000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DeployCloakSwap is Script, Deployers {
    // Addresses for Sepolia Base
    address constant POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
    address constant CREATE2_DEPLOYER =
        address(0x4e59b44847b379578588920cA78FbF26c0B4956C);
    address constant POOL_SWAP_TEST =
        0x8B5bcC363ddE2614281aD875bad385E0A785D3B9;
    address constant POOL_MODIFY_LIQUIDITY_TEST =
        0x37429cD17Cb1454C34E7F50b09725202Fd533039;

    // Test issuer address (update with your issuer address)
    address constant TEST_ISSUER = 0x17156c0cf9701b09114CB3619D9f3fD937caA3A8;

    function run() public {
        vm.startBroadcast();

        // Deploy ComplianceStoreFHE
        ComplianceStoreFHE complianceStore = new ComplianceStoreFHE();
        console.log("ComplianceStoreFHE deployed at:", address(complianceStore));

        // Deploy ProductConfig
        ProductConfig productConfig = new ProductConfig();
        console.log("ProductConfig deployed at:", address(productConfig));

        // Deploy test tokens
        TestToken usdc = new TestToken("USD Coin", "USDC");
        TestToken gGold = new TestToken("Gold Token", "gGOLD");
        console.log("USDC deployed at:", address(usdc));
        console.log("gGOLD deployed at:", address(gGold));

        // Ensure token0 < token1 for Uniswap ordering
        (address token0Addr, address token1Addr) = address(usdc) <
            address(gGold)
            ? (address(usdc), address(gGold))
            : (address(gGold), address(usdc));

        // Set up pool manager and routers
        manager = IPoolManager(POOL_MANAGER);
        modifyLiquidityRouter = PoolModifyLiquidityTest(
            POOL_MODIFY_LIQUIDITY_TEST
        );
        swapRouter = PoolSwapTest(POOL_SWAP_TEST);

        // Mine hook address
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);
        bytes memory creationCode = type(CloakSwapHook).creationCode;
        bytes memory constructorArgs = abi.encode(
            POOL_MANAGER,
            address(complianceStore),
            address(productConfig)
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            creationCode,
            constructorArgs
        );

        console.log("Computed Hook Address:", hookAddress);

        // Deploy hook
        CloakSwapHook hook = new CloakSwapHook{salt: salt}(
            IPoolManager(POOL_MANAGER),
            complianceStore,
            productConfig
        );
        console.log("CloakSwapHook deployed at:", address(hook));

        // Create pool key
        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(token0Addr),
            currency1: Currency.wrap(token1Addr),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        PoolId poolId = pool.toId();
        console.log("Pool ID:");
        console.logBytes32(PoolId.unwrap(poolId));

        // Initialize pool
        manager.initialize(pool, 4411237397794263893240602165248);

        // Set product for pool
        hook.setPoolProductByKey(pool, ProductConfig.PRODUCT_GOLD);

        // Allow issuer for gGOLD product
        complianceStore.allowIssuer(ProductConfig.PRODUCT_GOLD, TEST_ISSUER);

        // Approve tokens
        IERC20(token0Addr).approve(address(POOL_MANAGER), type(uint256).max);
        IERC20(token1Addr).approve(address(POOL_MANAGER), type(uint256).max);
        IERC20(token0Addr).approve(
            address(modifyLiquidityRouter),
            type(uint256).max
        );
        IERC20(token1Addr).approve(
            address(modifyLiquidityRouter),
            type(uint256).max
        );

        // Add liquidity
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -6000,
            tickUpper: 6000,
            liquidityDelta: 1000000 ether,
            salt: bytes32(0)
        });

        modifyLiquidityRouter.modifyLiquidity(pool, params, new bytes(0));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("ComplianceStoreFHE:", address(complianceStore));
        console.log("ProductConfig:", address(productConfig));
        console.log("CloakSwapHook:", address(hook));
        console.log("USDC:", address(usdc));
        console.log("gGOLD:", address(gGold));
        console.log("Pool ID:", PoolId.unwrap(poolId));
        console.log("Test Issuer:", TEST_ISSUER);
        console.log("========================\n");
    }
}
