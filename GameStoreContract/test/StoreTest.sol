// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol" as StdTest;
import {Store} from "../src/Store.sol";
import {MockAggregator} from "../mocks/MockAggregator.sol";

contract StoreTest is StdTest.Test {
    Store public store;
    address private testAccount = address(0xA1);
    address private testAccount2  = address(0xB2);
    address private testAccount3  = address(0xC3);

    function setUp() public {
        // Deploy mock with an initial price of 76,59 * 10⁸ (Chainlink feeds use 8 decimals)
        MockAggregator mock = new MockAggregator(
            7659000000,    // 76,59 usd
            8,             // 8 decimals
            "Mock SOL/USD",// description
            1              // version
        );

        // set items
        uint[] memory idsArray = new uint[](4);
        idsArray[0] = 1;
        idsArray[1] = 2;
        idsArray[2] = 3;
        // set prices
        uint[] memory pricesArray = new uint[](4);
        pricesArray[0] = 10;
        pricesArray[1] = 20;
        pricesArray[2] = 30;

        store = new Store(address(0xC3), address(mock), idsArray, pricesArray, "https://info_url.json");
        // give some ether
        vm.deal(testAccount, 1 ether);
        vm.deal(testAccount2, 1 ether);
        vm.deal(testAccount3, 1 ether);
    }

    function testAddAndReadItems() public {
        vm.prank(testAccount);
        store.purchaseItem{value: 3916969 wei}(3);
        uint[] memory boughtItems = store.getBoughtItems(testAccount);
        assertEq(boughtItems.length, 1);
        assertEq(boughtItems[0], 3);
        vm.prank(testAccount);
        store.purchaseItem{value: 2611306 wei}(2);

        boughtItems = store.getBoughtItems(testAccount);
        assertEq(boughtItems.length, 2);
        assertEq(boughtItems[0], 2);
        assertEq(boughtItems[1], 3);
    }

    function testBuyItemFewSameTimes() public {
        vm.prank(testAccount3);
        store.purchaseItem{value: 2611306 wei}(1);

        vm.prank(testAccount3);
        store.purchaseItem{value: 2611306 wei}(1);

        uint[] memory boughtItems = store.getBoughtItems(testAccount3);
        assertEq(boughtItems.length, 1);
        assertEq(boughtItems[0], 1);
    }

    function testBuyItemWithInsufficientFounds() public {
        vm.prank(testAccount2);
        vm.expectRevert("Insufficient funds");
        store.purchaseItem{value: 1 wei}(1);
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
