// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItemsERC1155 is ERC1155, Ownable {
    uint[] private ids; // массив ids предметов
    mapping(uint => uint) private itemIdsPrice; // itemId => usd cent(0.xx) price

    constructor(string memory uri, address owner) ERC1155(uri) Ownable(owner) {}

    // установить цену (только владелец)
    function setPrice(uint256 id, uint256 price) external onlyOwner {
        // предмет еще не добавлялся
        if (itemIdsPrice[id] == 0) {
            ids.push(id);
        }
        itemIdsPrice[id] = price;
    }

    // получить цену
    function priceOf(uint256 id) external view returns (uint256) {
        return itemIdsPrice[id];
    }

    function items() external view returns (uint[] memory) {
        return ids;
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        // сначала нужно установить цену предмета
        require(itemIdsPrice[id] != 0, "Item price is not set");
        _mint(to, id, amount, data);
    }
}