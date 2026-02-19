// test/mocks/MockAggregator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MockAggregator is AggregatorV3Interface {
    // ---------- stored state ----------
    int256 private _price;
    uint8  private _decimals;
    string private _description;
    uint256 private _version;

    uint80 private _latestRoundId;
    uint256 private _updatedAt;

    // ---------- constructor ----------
    constructor(
        int256 initPrice,
        uint8  initDecimals,
        string memory initDescription,
        uint256 initVersion
    ) {
        _price = initPrice;
        _decimals = initDecimals;
        _description = initDescription;
        _version = initVersion;

        _latestRoundId = 1;
        _updatedAt = block.timestamp;
    }

    // ---------- helper for tests ----------
    function setPrice(int256 newPrice) external {
        _price = newPrice;
        _updatedAt = block.timestamp;
        _latestRoundId++;
    }

    // ---------- interface implementations ----------
    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function version() external view override returns (uint256) {
        return _version;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        // For simplicity, we return the same data for any roundId
        return (
            _roundId,
            _price,
            0,
            _updatedAt,
            _roundId
        );
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _latestRoundId,
            _price,
            0,
            _updatedAt,
            _latestRoundId
        );
    }
}