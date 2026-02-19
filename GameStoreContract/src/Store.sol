// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { console } from "forge-std/console.sol";

/**
 * An in game store contract
 * 1. buy items, transferring money to store wallet
 * 2. store/retrieve information about bought items
 */
contract Store {
    mapping(uint => uint) private itemIdsPrice; // itemId => usd cent(0.xx) price
    mapping(address => uint[]) private boughtItems;
    AggregatorV3Interface internal priceFeed;
    address public immutable STORE_ADDRESS;

    constructor(address _store, address _aggregatorAddress, uint[] memory itemsIds, uint[] memory itemsPrices) {
        STORE_ADDRESS = _store;
        // MATIC/USDT 0xAB594600376Ec9fD91F8e885dADF0CE036862dE0
        priceFeed = AggregatorV3Interface(_aggregatorAddress);

        require(itemsIds.length > 0, "Invalid constructor params");
        require(itemsIds.length == itemsPrices.length, "Invalid constructor params");
        for (uint256 index = 0; index < itemsIds.length; index++) {
            itemIdsPrice[itemsIds[index]] = itemsPrices[index];
        }
    }

    /**
     * Get latest price
     */
    function getLatestPrice() private view returns (int256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();

        require(price > 0, "Invalid price");
        require(updatedAt != 0, "Round not complete");
        require(block.timestamp - updatedAt < 3600, "Stale price"); // Порог 1 час

        return price; // Цена с 8‑мя знаками после запятой
    }

    function purchaseItem(uint _itemId) external payable {
        uint itemPriceUsdCents = itemIdsPrice[_itemId];
        // If the key has never been assigned, `price` will be 0.
        // Assuming a price of 0 is never valid, revert the call.
        require(itemPriceUsdCents != 0, "Transfer failed");

        console.log("Current item price in usd cents:", uint256(itemPriceUsdCents));
        int256 latestSolUsdPrice = getLatestPrice();
        require(latestSolUsdPrice >= 0, "Price must be nonnegative");
        // forge-lint: disable-next-line(unsafe-typecast)
        uint256 currentSolUsdPrice = uint256(latestSolUsdPrice);
        console.log("Current Price SOL/USD:", currentSolUsdPrice);

        uint256 solDecimals = priceFeed.decimals();
        console.log("Decimals: %s", solDecimals);

        // set price in wei.
        uint256 resultDecimals = 9; // 1 SOL = 10⁹ wei
        // convert to wei decimals, convert to sol/usd price decimals, convert cents to usd(1/100)
        uint256 itemPriceWithResultDecimalsUsd = uint256(itemPriceUsdCents) * (10 ** resultDecimals) * (10 ** solDecimals) / 100;
        uint256 itemCost = itemPriceWithResultDecimalsUsd / uint256(currentSolUsdPrice);
        console.log("Item price in SOL wei:", itemCost);
        // check if buyer send enough founds
        require(msg.value >= itemCost, "Insufficient funds");
        // Forward the funds to the seller
        (bool success, ) = STORE_ADDRESS.call{value: itemCost}("");
        require(success, "Transfer failed");

        boughtItems[msg.sender].push(_itemId);
    }

    // Function to retrieve all items bought by a specific user
    function getBoughtItems(address _user) public view returns (uint[] memory) {
        if (_user == address(0)) {
            // Return an empty array – callers can treat it as “no purchases”
            return new uint[](0);
        }
        return boughtItems[_user];
    }
}
