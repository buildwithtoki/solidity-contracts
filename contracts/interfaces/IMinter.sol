// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0;

interface IMinter {
    // Mint [amount] number of tokens and send to [addr]
    function mintToken(address addr, uint256 amount) external;
}
