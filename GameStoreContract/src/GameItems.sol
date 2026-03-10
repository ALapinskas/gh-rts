// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GameItemsERC1155 is ERC1155, Ownable {
    uint[] private ids; // массив ids предметов
    mapping(uint => uint) private itemIdsPrice; // itemId => usd cent(0.xx) price
    using Strings for uint256;

    constructor(string memory baseUri, address owner) ERC1155(baseUri) Ownable(owner) {}

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
        require(itemIdsPrice[id] != 0, "Item price is not set");
        _mint(to, id, amount, data);
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(super.uri(id), Strings.toString(id), ".json"));
    }

    function ownerOf(uint256 /*id*/) public pure returns (address) {
        revert("ERC1155 token, use balanceOf");
    }
}