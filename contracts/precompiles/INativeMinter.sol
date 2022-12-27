// (c) 2022-2023, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./IAllowList.sol";

// 0x0200000000000000000000000000000000000001
interface INativeMinter is IAllowList {
    // Mint [amount] number of native coins and send to [addr]
    function mintNativeCoin(address addr, uint256 amount) external;
}
