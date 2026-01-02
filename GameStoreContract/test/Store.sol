// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol" as StdTest;
import {Store} from "../src/Store.sol";

contract CounterTest is StdTest.Test {
    Store public store;
    address private testAccount = address(0xA1);
    address private testAccount2  = address(0xB2);

    function setUp() public {
        store = new Store(address(0xC3));
        // give some ether
        vm.deal(testAccount, 1 ether);
    }

    function testAddAndReadItems() public {
        vm.prank(testAccount);
        store.purchaseItem{value: 2 gwei}(42);
        vm.prank(testAccount);
        store.purchaseItem{value: 2 gwei}(99);

        uint8[] memory boughtItems = store.getBoughtItems(testAccount);
        assertEq(boughtItems.length, 2);
        assertEq(boughtItems[0], 42);
        assertEq(boughtItems[1], 99);
    }

    function testBoughtNothing() public {
        vm.prank(testAccount2);
        uint8[] memory boughtItems = store.getBoughtItems(testAccount2);
        store.getBoughtItems(testAccount2);
        assertEq(boughtItems.length, 0);
    }
}
