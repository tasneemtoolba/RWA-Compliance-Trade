// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProductConfig
 * @dev Configuration for RWA products (e.g., gGOLD)
 */
contract ProductConfig is Ownable {
    // Product ID for gGOLD
    uint256 public constant PRODUCT_GOLD = 1;

    struct Product {
        uint256 productId;
        string name;
        string symbol;
        address tokenAddress; // ERC20 token address for this product
        bool exists;
    }

    // Mapping from productId to Product
    mapping(uint256 => Product) public products;

    // Events
    event ProductRegistered(
        uint256 indexed productId,
        string name,
        string symbol,
        address tokenAddress
    );

    constructor() Ownable(msg.sender) {
        // Register gGOLD as the default product
        _registerProduct(
            PRODUCT_GOLD,
            "Gold Token",
            "gGOLD",
            address(0) // Will be set later
        );
    }

    /**
     * @dev Register a new product
     * @param productId Unique product identifier
     * @param name Product name
     * @param symbol Product symbol
     * @param tokenAddress ERC20 token address
     */
    function registerProduct(
        uint256 productId,
        string memory name,
        string memory symbol,
        address tokenAddress
    ) external onlyOwner {
        _registerProduct(productId, name, symbol, tokenAddress);
    }

    /**
     * @dev Internal function to register a product
     */
    function _registerProduct(
        uint256 productId,
        string memory name,
        string memory symbol,
        address tokenAddress
    ) internal {
        require(!products[productId].exists, "Product already exists");

        products[productId] = Product({
            productId: productId,
            name: name,
            symbol: symbol,
            tokenAddress: tokenAddress,
            exists: true
        });

        emit ProductRegistered(productId, name, symbol, tokenAddress);
    }

    /**
     * @dev Update token address for a product
     * @param productId Product ID
     * @param tokenAddress New token address
     */
    function setTokenAddress(
        uint256 productId,
        address tokenAddress
    ) external onlyOwner {
        require(products[productId].exists, "Product does not exist");
        products[productId].tokenAddress = tokenAddress;
    }

    /**
     * @dev Get product information
     * @param productId Product ID
     * @return product The product information
     */
    function getProduct(
        uint256 productId
    ) external view returns (Product memory product) {
        require(products[productId].exists, "Product does not exist");
        return products[productId];
    }

    /**
     * @dev Check if a product exists
     * @param productId Product ID
     * @return exists Whether the product exists
     */
    function productExists(uint256 productId) external view returns (bool) {
        return products[productId].exists;
    }
}
