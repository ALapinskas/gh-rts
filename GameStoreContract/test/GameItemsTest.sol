// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/GameItems.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract GameItemsERC1155Test is Test {
    GameItemsERC1155 private gameItems;
    address private owner;
    address private nonOwner;

    function setUp() public {
        // Установка адресов
        owner = address(0x123);
        nonOwner = address(0x456);

        // Развертывание контракта
        gameItems = new GameItemsERC1155("https://example.com/api/", owner);
    }

    function testOwnerCanSetPrice() public {
        vm.prank(owner); 
        gameItems.setPrice(1, 1000);
        assertEq(gameItems.priceOf(1), 1000, "Owner should be able to set the price");
    }

    function testNonOwnerCannotSetPrice() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        //vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(nonOwner); // Устанавливаем контекст не минтера
        gameItems.setPrice(3, 2000);
    }

    function testOwnerCanMint() public {
        vm.prank(owner); 
        gameItems.setPrice(1, 1000);
        
        vm.prank(owner); // Устанавливаем контекст на минтера
        gameItems.mint(owner, 1, 1, ""); // Выпуск предмета от имени минтера
        assertEq(gameItems.balanceOf(owner, 1), 1, "Minter should mint an item");
    }

    function testNonOwnerCannotMint() public {
        vm.prank(owner); 
        gameItems.setPrice(1, 1000);
        
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        vm.prank(nonOwner); // Устанавливаем контекст не минтера
        gameItems.mint(nonOwner, 1, 1, "");
    }
}
