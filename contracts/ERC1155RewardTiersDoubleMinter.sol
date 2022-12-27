//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./precompiles/INativeMinter.sol";
import "./interfaces/IERC1155Minter.sol";
import "./precompiles/IERC1155AllowList.sol";


/**
 * @title ERC1155RewardTiersDoubleMinter
 * To DoubleMint both ERC1155 and native tokens,
 *  - ERC1155RewardTiersDoubleMinter must be owned by a wallet, ERC1155RewardTiersDoubleMinterRole
 *  - ERC1155RewardTiersDoubleMinterRole is enabled for both ERC1155 and native minting
 *  - ERC1155RewardTiersDoubleMinter contract is enabled for both ERC1155 and native minting
 *  - One ERC1155RewardTiersDoubleMinter per ERC1155 token ID
 */
contract ERC1155RewardTiersDoubleMinter is Ownable {

    INativeMinter private _nativeMinter =
        INativeMinter(0x0200000000000000000000000000000000000001);
    IAllowList private _tokenContract;

    // These constants are defined here
    // https://docs.avax.network/subnets/customize-a-subnet#restricting-smart-contract-deployers
    uint256 constant ROLE_NONE = 0;
    uint256 constant ROLE_ENABLED = 1;
    uint256 constant ROLE_ADMIN = 2;

    /**
     * @param erc1155Contract address of the ERC1155 token contract
     */
    constructor(address erc1155Contract)
    {
        _tokenContract = IAllowList(erc1155Contract);
    }

    /**
     * @return address of the erc1155 token contract
     */
    function getERC1155Contract()
        public view
        returns (address)
    {
        return address(_tokenContract);
    }

    /**
     * @dev Mints both ERC1155 of specified collection and native
       tokens to the given address in one operation.
     * @param amountNative Amount of native tokens given to user
     * @param amountERC1155 Amount of ERC1155 tokens given to user
     * @param to Address to receive tokens
     * @param id Collection ID
     */
    function mintTokens(
        address to,
        uint256 amountNative,
        uint256 id,
        uint256 amountERC1155
    ) external {
        uint256 contractNativeRole = _nativeMinter.readAllowList(address(this));
        require(
            contractNativeRole == ROLE_ADMIN ||
                contractNativeRole == ROLE_ENABLED,
            "this contract is not authorized to mint native token"
        );
        uint256 contractERC1155Role = _tokenContract.readAllowList(address(this));
        require(
            contractERC1155Role == ROLE_ADMIN ||
                contractERC1155Role == ROLE_ENABLED,
            "this contract is not authorized to mint ERC1155 tokens"
        );
        uint256 senderNativeRole = _nativeMinter.readAllowList(msg.sender);
        require(
            senderNativeRole == ROLE_ADMIN || senderNativeRole == ROLE_ENABLED,
            "sender is not authorized to mint native token"
        );
        uint256 senderERC1155Role = _tokenContract.readAllowList(msg.sender);
        require(
            senderERC1155Role == ROLE_ADMIN || senderERC1155Role == ROLE_ENABLED,
            "sender is not authorized to mint ERC1155 token"
        );

        _nativeMinter.mintNativeCoin(to, amountNative);
        IERC1155Minter(address(_tokenContract)).mintToken(to, id, amountERC1155);
    }
}
