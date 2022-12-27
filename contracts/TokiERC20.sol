//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./precompiles/IAllowList.sol";
import "./interfaces/IMinter.sol";

contract TokiERC20 is ERC20, Ownable, IAllowList, IMinter {
    uint256 constant ROLE_NONE = 0;
    uint256 constant ROLE_ENABLED = 1;
    uint256 constant ROLE_ADMIN = 2;

    mapping(address => uint256) internal role;

    /**
     * @param name ERC20 token name
     * @param symbol ERC20 token symbol
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    }

    ////////////////////////////////////////////////////////////////////////////////
    // IMinter Implementation
    ////////////////////////////////////////////////////////////////////////////////

    // Set [addr] to have the admin role over the minter list
    function setAdmin(address addr) external override {
        require(
            role[msg.sender] == ROLE_ADMIN || msg.sender == owner(),
            "Only an admin can set an admin role"
        );
        require(
            addr != owner(),
            "Role for the owner cannot be set"
        );
        role[addr] = ROLE_ADMIN;
    }

    // Set [addr] to be enabled on the minter list
    function setEnabled(address addr) external override {
        require(
            role[msg.sender] == ROLE_ADMIN || msg.sender == owner(),
            "Only an admin can enable a minter"
        );
        require(
            addr != owner(),
            "Role for the owner cannot be set"
        );
        role[addr] = ROLE_ENABLED;
    }

    // Set [addr] to have no role over the minter list
    function setNone(address addr) external override {
        require(
            role[msg.sender] == ROLE_ADMIN || msg.sender == owner(),
            "Only an admin can set roles"
        );
        require(
            addr != owner(),
            "Role for the owner cannot be set"
        );
        role[addr] = ROLE_NONE;
    }

    // Read the status of [addr]
    // returns an integer representing the role of the address
    // 0: none, 1: minter, 2: admin
    function readAllowList(address addr)
        external
        view
        override
        returns (uint256)
    {
        if (addr == owner()) {
            return ROLE_ADMIN;
        }
 
        return role[addr];
    }

    // Mint [amount] number of tokens and send to [addr]
    function mintToken(address addr, uint256 amount) external override {
        require(
            role[msg.sender] == ROLE_ENABLED || role[msg.sender] == ROLE_ADMIN || msg.sender == owner(),
            "Only allowed minters can mint tokens"
        );
        _mint(addr, amount);
    }
}
