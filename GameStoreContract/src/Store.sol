// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/**
 * An in game store contract
 * 1. buy items, transferring money to store wallet
 * 2. store/retrieve information about bought items
 */
contract Store {
    mapping(address => uint8[]) private boughtItems;

    address public immutable STORE_ADDRESS;

    constructor(address _store) {
        STORE_ADDRESS = _store;
    }

    function purchaseItem(uint8 _itemId) external payable {
        uint256 itemCost = 2 gwei; // 0.0012 USD / 0.18 RUB;

        // Forward the funds to the seller
        (bool success, ) = STORE_ADDRESS.call{value: itemCost}("");
        require(success, "Transfer failed");

        boughtItems[msg.sender].push(_itemId);
    }

    // Function to retrieve all items bought by a specific user
    function getBoughtItems(address _user) public view returns (uint8[] memory) {
        if (_user == address(0)) {
            // Return an empty array – callers can treat it as “no purchases”
            return new uint8[](0);
        }
        return boughtItems[_user];
    }
}
