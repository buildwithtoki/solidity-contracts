// (c) 2022-2023, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "./IAllowList.sol";

// 0x0200000000000000000000000000000000000003
interface IFeeManager is IAllowList {
    // Set fee config fields to contract storage
    function setFeeConfig(
        uint256 gasLimit,
        uint256 targetBlockRate,
        uint256 minBaseFee,
        uint256 targetGas,
        uint256 baseFeeChangeDenominator,
        uint256 minBlockGasCost,
        uint256 maxBlockGasCost,
        uint256 blockGasCostStep
    ) external;

    // Get fee config from the contract storage
    function getFeeConfig()
        external
        view
        returns (
            uint256 gasLimit,
            uint256 targetBlockRate,
            uint256 minBaseFee,
            uint256 targetGas,
            uint256 baseFeeChangeDenominator,
            uint256 minBlockGasCost,
            uint256 maxBlockGasCost,
            uint256 blockGasCostStep
        );

    // Get the last block number changed the fee config from the contract storage
    function getFeeConfigLastChangedAt()
        external
        view
        returns (uint256 blockNumber);
}
