// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./interfaces/IERC1155Minter.sol";
import "./precompiles/IAllowList.sol";


contract RewardTierERC1155 is ERC1155, Ownable, IERC1155Minter, IAllowList {
    
    uint256 constant ROLE_NONE = 0;
    uint256 constant ROLE_ENABLED = 1;
    uint256 constant ROLE_ADMIN = 2;
    mapping(address => uint256) internal role;


    RewardTierInfo[] public rewardTiers;
    uint256 public rewardTierCount;

    struct RewardTierInfo {
        string rewardTierName;
        uint256 requiredRewardAmount;
        uint256 maxTotalSupply;
        uint256 totalSupply;
        string uri;
    }

    event UriSet(uint256 rewardTierId, string newUri);
    event RewardTierAdded(
        string rewardTierName,
        uint256 requiredRewardAmount,
        string uri
    );

    event RewardTierEdited(
        uint256 rewardTierId,
        uint256 newRequiredRewardAmount
    );

    constructor(
        address _creatorAddress,
        uint256[] memory _maxTotalSupplies,
        string[] memory _rewardTierNames,
        uint256[] memory _requiredRewardAmounts,
        string[] memory _uris
    ) ERC1155("") {
        _transferOwnership(_creatorAddress);
        require(
            _maxTotalSupplies.length == _rewardTierNames.length &&
            _maxTotalSupplies.length == _requiredRewardAmounts.length &&
            _maxTotalSupplies.length == _uris.length &&
            _rewardTierNames.length == _requiredRewardAmounts.length &&
            _rewardTierNames.length == _uris.length &&
            _requiredRewardAmounts.length == _uris.length,
            "incorrect length"
        );

        for (uint256 i = 0; i < _rewardTierNames.length; i++) {
            require(bytes(_uris[i]).length != 0, "incorrect URI");
            require(bytes(_rewardTierNames[i]).length != 0, "incorrect name");
            require(_maxTotalSupplies[i] > 0, "incorrect max supply");
            rewardTiers.push(
                RewardTierInfo(
                    _rewardTierNames[i],
                    _requiredRewardAmounts[i],
                    _maxTotalSupplies[i],
                    0,
                    _uris[i]
                )
            );
        }

        rewardTierCount = _maxTotalSupplies.length;
    }

    function addRewardTier(
        string memory _rewardTierName,
        uint256 _requiredRewardAmount,
        uint256 _maxTotalSupply,
        string memory _uri
    ) external onlyOwner {
        require(_maxTotalSupply > 0, "incorrect max supply");
        rewardTiers.push(
            RewardTierInfo(
                _rewardTierName,
                _requiredRewardAmount,
                _maxTotalSupply,
                0,
                _uri
            )
        );
        rewardTierCount++;
        emit RewardTierAdded(
            _rewardTierName,
            _requiredRewardAmount,
            _uri
        );
        
    }

    function editRequiredRewardAmount(uint256 _rewardTierId, uint256 _newRequiredRewardAmount) external onlyOwner {        
        require(_rewardTierId < rewardTierCount, "incorrect tierId");
        rewardTiers[_rewardTierId].requiredRewardAmount = _newRequiredRewardAmount;
        emit RewardTierEdited(_rewardTierId, _newRequiredRewardAmount);
    }
 

    function setUri(uint256 _rewardTierId, string memory _newUri) external onlyOwner {
        rewardTiers[_rewardTierId].uri = _newUri;
        emit UriSet(_rewardTierId, _newUri);
    }



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
    function mintToken(address addr, uint256 id, uint256 amount) external override {
        require(
            role[msg.sender] == ROLE_ENABLED || role[msg.sender] == ROLE_ADMIN || msg.sender == owner(),
            "Only allowed minters can mint tokens"
        );
        require(id < rewardTierCount, "incorrect ID");
        rewardTiers[id].totalSupply += amount; 
        require(rewardTiers[id].totalSupply < rewardTiers[id].maxTotalSupply, "max supply exceeded");
        _mint(addr, id, amount, "");
    }


    function uri(uint256 _rewardTierId) public view virtual override returns (string memory) {
        require(_rewardTierId < rewardTierCount, "incorrect collection ID");
        return rewardTiers[_rewardTierId].uri;
    }
   
}

