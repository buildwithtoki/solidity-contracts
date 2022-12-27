// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0;

interface IERC1155Minter {
    // Mint [amount] number of tokens and send to [addr]
    function mintToken(address addr, uint256 id, uint256 amount) external;
}
