// (c) 2022-2023, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

// 0x0200000000000000000000000000000000000000
interface IERC1155AllowList {
    // Set [addr] to have the admin role over the allow list in collection with [id]
    function setAdmin(address addr, uint256 id) external;

    // Set [addr] to be enabled on the allow list in collection with [id]
    function setEnabled(address addr, uint256 id) external;

    // Set [addr] to have no role over the allow list in collection with [id]
    function setNone(address addr, uint256 id) external;

    // Read the status of [addr] in collection with [id]
    function readAllowList(address addr, uint256 id) external view returns (uint256);
}
