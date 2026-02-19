// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol" as StdTest;
import {Store} from "../src/Store.sol";
import {MockAggregator} from "../mocks/MockAggregator.sol";

contract CounterTest is StdTest.Test {
    Store public store;
    address private testAccount = address(0xA1);
    address private testAccount2  = address(0xB2);
    MockAggregator private mock;

    function setUp() public {
        // Deploy mock with an initial price of 76,59 * 10⁸ (Chainlink feeds use 8 decimals)
        mock = new MockAggregator(
            7659000000,    // 76,59 usd
            8,             // 8 decimals
            "Mock SOL/USD",// description
            1              // version
        );

        // set items
        uint[] memory idsArray = new uint[](2);
        idsArray[0] = 42;
        idsArray[1] = 99;
        // set prices
        uint[] memory pricesArray = new uint[](2);
        pricesArray[0] = 10;
        pricesArray[1] = 20;
        store = new Store(address(0xC3), address(mock), idsArray, pricesArray);
        // give some ether
        vm.deal(testAccount, 1 ether);
        vm.deal(testAccount2, 1 ether);
    }

    function testAddAndReadItems() public {
        vm.prank(testAccount);
        store.purchaseItem{value: 1305653 wei}(42);
        vm.prank(testAccount);
        store.purchaseItem{value: 2611306 wei}(99);

        uint[] memory boughtItems = store.getBoughtItems(testAccount);
        assertEq(boughtItems.length, 2);
        assertEq(boughtItems[0], 42);
        assertEq(boughtItems[1], 99);
    }

    function testBuyItemWithInsufficientFounds() public {
        vm.prank(testAccount2);
        vm.expectRevert("Insufficient funds");
        store.purchaseItem{value: 1 wei}(42);
    }

    function testBuyNonExistItem() public {
        vm.prank(testAccount);
        vm.expectRevert("Transfer failed");
        store.purchaseItem{value: 13056534 wei}(999);
    }

    function testBoughtNothing() public {
        vm.prank(testAccount2);
        uint[] memory boughtItems = store.getBoughtItems(testAccount2);
        store.getBoughtItems(testAccount2);
        assertEq(boughtItems.length, 0);
    }
}
