// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { GameItemsERC1155 } from "./GameItems.sol";
import { console } from "forge-std/console.sol";

/**
 * An in game store contract
 * 1. buy items, transferring money to store wallet and mint the item
 * 2. translate usd item price to eth, or matic using oracle feeds
 * 3. store/retrieve information about bought items
 */
contract Store {
    //mapping(address => uint[]) private boughtItems;
    AggregatorV3Interface internal priceFeed;
    GameItemsERC1155 private gameItemsContract;
    address public immutable STORE_ADDRESS;

    constructor(
        address _store, 
        address _aggregatorAddress,
        uint[] memory itemsIds, 
        uint[] memory itemsPrices,
        // url вида
        // в контракте хранится часть до {id} 
        // {id} десятичное число
        // https://gateway.pinata.cloud/ipfs/bafybeibvehy3km54e2ed2d3lmzqrijzbsawiwj244foqivtjeqlqblxiie/{id}.json
        // https://ivory-key-whitefish-770.mypinata.cloud/ipfs/bafybeibvehy3km54e2ed2d3lmzqrijzbsawiwj244foqivtjeqlqblxiie/{id}.json
        string memory itemsJsonUrl) {
        STORE_ADDRESS = _store;
        priceFeed = AggregatorV3Interface(_aggregatorAddress);

        require(itemsIds.length > 0, "Invalid constructor params");
        require(itemsIds.length == itemsPrices.length, "Invalid constructor params");
        require(bytes(itemsJsonUrl).length > 0, "Invalid constructor params");
        // initiate items example param: "https://game.example/api/item/{id}.json"
        gameItemsContract = new GameItemsERC1155(itemsJsonUrl, address(this));
        
        // устанавливаем ids и цены
        for (uint256 index = 0; index < itemsIds.length; index++) {
            gameItemsContract.setPrice(itemsIds[index], itemsPrices[index]);
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
        uint itemPriceUsdCents = gameItemsContract.priceOf(_itemId);
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

        // Если транзацкция прошла, минтим предмет покупателю
        gameItemsContract.mint(msg.sender, _itemId, 1, "");
        
        // если нужно вернуть сдачу покупателю
        if (msg.value > itemCost) {
            (bool refundOk, ) = msg.sender.call{value: msg.value - itemCost}("");
            require(refundOk, "Refund failed");
        }
    }

    /**
     * Function to retrieve all items bought by a specific user
     * It returns an Array itemId, boughtCount
     */
    function getBoughtItems(address _user) public view returns (uint[] memory) {
        if (_user == address(0)) {
            // Return an empty array – callers can treat it as “no purchases”
            return new uint[](0);
        }

        uint[] memory items = gameItemsContract.items();
        uint itemsBoughtCount = 0;
        for (uint256 i = 0; i < items.length; ++i) {
            uint256 itemId = items[i];
            uint256 itemsAmount = gameItemsContract.balanceOf(_user, itemId);
            if (itemsAmount > 0) {
                itemsBoughtCount++;
            }
        }
        uint[] memory itemsBought = new uint[](itemsBoughtCount * 2);
        uint counter = 0;
        for (uint256 i = 0; i < items.length; ++i) {
            uint256 itemId = items[i];
            uint256 boughtCount = gameItemsContract.balanceOf(_user, itemId);
            if (boughtCount > 0) {
                itemsBought[counter] = itemId;
                counter++;
                itemsBought[counter] = boughtCount;
                counter++;
            }
        }
        return itemsBought;
    }

    /** */
    function supportsInterface(bytes4 /*interfaceId*/) external pure returns (bool) {
        return false;
    }
    function symbol() external pure returns (string memory) {
        revert("Function not supported");
    }
    function decimals() external pure returns (uint8) {
        revert("Function not supported");
    }
    function balanceOf(address /*account*/) external pure returns (uint256) {
        revert("Function not supported");
    }
}
