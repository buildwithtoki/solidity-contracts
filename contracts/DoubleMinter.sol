//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./precompiles/INativeMinter.sol";
import "./TokiERC20.sol";


/**
 * @title DoubleMinter
 * To DoubleMint both ERC20 and native tokens,
 *  - DoubleMinter must be owned by a wallet, DoubleMinterRole
 *  - DoubleMinterRole is enabled for both ERC20 and native minting
 *  - DoubleMinter contract is enabled for both ERC20 and native minting
 *  - One DoubleMinter per ERC20 token
 */
contract DoubleMinter is Ownable {

    INativeMinter private _nativeMinter =
        INativeMinter(0x0200000000000000000000000000000000000001);
    TokiERC20 private _tokenContract;

    // These constants are defined here
    // https://docs.avax.network/subnets/customize-a-subnet#restricting-smart-contract-deployers
    uint256 constant ROLE_NONE = 0;
    uint256 constant ROLE_ENABLED = 1;
    uint256 constant ROLE_ADMIN = 2;

    /**
     * @param erc20Contract address of the ERC20 token contract
     */
    constructor(address erc20Contract)
    {
        _tokenContract = TokiERC20(erc20Contract);
    }

    /**
     * @return address of the erc20 token contract
     */
    function getERC20Contract()
        public view
        returns (address)
    {
        return address(_tokenContract);
    }

    /**
     * @dev Mints both ERC20 and native tokens to the given address in one operation.
     * @param amountNative Amount of native tokens given to user
     * @param amountERC20 Amount of ERC20 tokens given to user
     * @param to Address to receive tokens
     */
    function mintTokens(
        address to,
        uint256 amountNative,
        uint256 amountERC20
    ) external {
        uint256 contractNativeRole = _nativeMinter.readAllowList(address(this));
        require(
            contractNativeRole == ROLE_ADMIN ||
                contractNativeRole == ROLE_ENABLED,
            "this contract is not authorized to mint native token"
        );
        uint256 contractERC20Role = _tokenContract.readAllowList(address(this));
        require(
            contractERC20Role == ROLE_ADMIN ||
                contractERC20Role == ROLE_ENABLED,
            "this contract is not authorized to mint ERC20 tokens"
        );
        uint256 senderNativeRole = _nativeMinter.readAllowList(msg.sender);
        require(
            senderNativeRole == ROLE_ADMIN || senderNativeRole == ROLE_ENABLED,
            "sender is not authorized to mint native token"
        );
        uint256 senderERC20Role = _tokenContract.readAllowList(msg.sender);
        require(
            senderERC20Role == ROLE_ADMIN || senderERC20Role == ROLE_ENABLED,
            "sender is not authorized to mint ERC20 token"
        );

        _nativeMinter.mintNativeCoin(to, amountNative);
        _tokenContract.mintToken(to, amountERC20);
    }
}
