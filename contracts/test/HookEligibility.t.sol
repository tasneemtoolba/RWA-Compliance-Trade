// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "v4-core/test/PoolSwapTest.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {SwapParams, ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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

contract HookEligibilityTest is Test, Deployers {
    CloakSwapHook hook;
    ComplianceStoreFHE complianceStore;
    ProductConfig productConfig;
    TestToken token0;
    TestToken token1;
    PoolKey poolKey;
    PoolId poolId;

    address user1 = address(0x1111);
    address user2 = address(0x2222);
    address issuer = address(0x3333);

    function setUp() public {
        // Deploy contracts
        complianceStore = new ComplianceStoreFHE();
        productConfig = new ProductConfig();

        // Deploy test tokens
        token0 = new TestToken("USDC", "USDC");
        token1 = new TestToken("gGOLD", "gGOLD");

        // Ensure token0 < token1 for Uniswap ordering
        (address token0Addr, address token1Addr) = address(token0) <
            address(token1)
            ? (address(token0), address(token1))
            : (address(token1), address(token0));

        // Set up pool manager
        manager = new PoolManager(500000);

        // Set up routers
        modifyLiquidityRouter = new PoolModifyLiquidityTest(manager);
        swapRouter = new PoolSwapTest(manager);

        // Mine hook address
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);
        bytes memory creationCode = type(CloakSwapHook).creationCode;
        bytes memory constructorArgs = abi.encode(
            manager,
            complianceStore,
            productConfig
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            flags,
            creationCode,
            constructorArgs
        );

        // Deploy hook
        hook = new CloakSwapHook{salt: salt}(
            manager,
            complianceStore,
            productConfig
        );

        // Create pool key
        poolKey = PoolKey({
            currency0: Currency.wrap(token0Addr),
            currency1: Currency.wrap(token1Addr),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        poolId = poolKey.toId();

        // Initialize pool
        manager.initialize(poolKey, 4411237397794263893240602165248);

        // Set product for pool
        hook.setPoolProductByKey(poolKey, ProductConfig.PRODUCT_GOLD);

        // Allow issuer
        complianceStore.allowIssuer(ProductConfig.PRODUCT_GOLD, issuer);

        // Mint tokens to users
        if (token0Addr == address(token0)) {
            token0.mint(user1, 10000 ether);
            token0.mint(user2, 10000 ether);
            token1.mint(address(this), 10000 ether);
        } else {
            token1.mint(user1, 10000 ether);
            token1.mint(user2, 10000 ether);
            token0.mint(address(this), 10000 ether);
        }

        // Add liquidity
        _addLiquidity();

        // Approve tokens
        IERC20(token0Addr).approve(address(swapRouter), type(uint256).max);
        IERC20(token1Addr).approve(address(swapRouter), type(uint256).max);
        IERC20(token0Addr).approve(address(modifyLiquidityRouter), type(uint256).max);
        IERC20(token1Addr).approve(address(modifyLiquidityRouter), type(uint256).max);
    }

    function _addLiquidity() internal {
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -6000,
            tickUpper: 6000,
            liquidityDelta: 1000000 ether,
            salt: bytes32(0)
        });

        modifyLiquidityRouter.modifyLiquidity(poolKey, params, new bytes(0));
    }

    function testEligibleSwapPasses() public {
        // Store eligible profile for user1
        bytes memory encJur = abi.encodePacked(uint8(1)); // Mock encrypted jurisdiction
        bytes memory encAccred = abi.encodePacked(uint8(1)); // Mock encrypted accredited
        bytes memory encLimit = abi.encodePacked(uint256(1000 ether)); // Mock encrypted limit

        vm.prank(issuer);
        complianceStore.storeProfile(
            user1,
            encJur,
            encAccred,
            encLimit,
            uint64(block.timestamp + 30 days),
            ProductConfig.PRODUCT_GOLD
        );

        // User1 should be able to swap
        vm.prank(user1);
        IERC20(address(token0) < address(token1) ? address(token0) : address(token1))
            .approve(address(swapRouter), type(uint256).max);

        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: 100 ether,
            sqrtPriceLimitX96: 0
        });

        vm.prank(user1);
        swapRouter.swap(poolKey, swapParams, new bytes(0));
    }

    function testExpiredCredentialFails() public {
        // Store expired profile for user1
        bytes memory encJur = abi.encodePacked(uint8(1));
        bytes memory encAccred = abi.encodePacked(uint8(1));
        bytes memory encLimit = abi.encodePacked(uint256(1000 ether));

        vm.prank(issuer);
        complianceStore.storeProfile(
            user1,
            encJur,
            encAccred,
            encLimit,
            uint64(block.timestamp - 1 days), // Expired
            ProductConfig.PRODUCT_GOLD
        );

        // Swap should fail
        vm.prank(user1);
        IERC20(address(token0) < address(token1) ? address(token0) : address(token1))
            .approve(address(swapRouter), type(uint256).max);

        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: 100 ether,
            sqrtPriceLimitX96: 0
        });

        vm.prank(user1);
        vm.expectRevert();
        swapRouter.swap(poolKey, swapParams, new bytes(0));
    }

    function testCredentialMissingFails() public {
        // User2 has no credential
        vm.prank(user2);
        IERC20(address(token0) < address(token1) ? address(token0) : address(token1))
            .approve(address(swapRouter), type(uint256).max);

        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: 100 ether,
            sqrtPriceLimitX96: 0
        });

        vm.prank(user2);
        vm.expectRevert();
        swapRouter.swap(poolKey, swapParams, new bytes(0));
    }

    function testIssuerNotAllowedFails() public {
        address unauthorizedIssuer = address(0x9999);

        // Try to store profile with unauthorized issuer
        bytes memory encJur = abi.encodePacked(uint8(1));
        bytes memory encAccred = abi.encodePacked(uint8(1));
        bytes memory encLimit = abi.encodePacked(uint256(1000 ether));

        vm.prank(unauthorizedIssuer);
        vm.expectRevert("Issuer not allowed");
        complianceStore.storeProfile(
            user1,
            encJur,
            encAccred,
            encLimit,
            uint64(block.timestamp + 30 days),
            ProductConfig.PRODUCT_GOLD
        );
    }

    function testRevokedCredentialFails() public {
        // Store and then revoke profile
        bytes memory encJur = abi.encodePacked(uint8(1));
        bytes memory encAccred = abi.encodePacked(uint8(1));
        bytes memory encLimit = abi.encodePacked(uint256(1000 ether));

        vm.prank(issuer);
        complianceStore.storeProfile(
            user1,
            encJur,
            encAccred,
            encLimit,
            uint64(block.timestamp + 30 days),
            ProductConfig.PRODUCT_GOLD
        );

        // Revoke
        vm.prank(issuer);
        complianceStore.revokeProfile(user1);

        // Swap should fail
        vm.prank(user1);
        IERC20(address(token0) < address(token1) ? address(token0) : address(token1))
            .approve(address(swapRouter), type(uint256).max);

        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: 100 ether,
            sqrtPriceLimitX96: 0
        });

        vm.prank(user1);
        vm.expectRevert();
        swapRouter.swap(poolKey, swapParams, new bytes(0));
    }
}
