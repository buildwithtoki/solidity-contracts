// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./interfaces/IERC1155Minter.sol";
import "./precompiles/IERC1155AllowList.sol";



contract RewardERC1155 is ERC1155, Ownable, IERC1155Minter, IERC1155AllowList {
    uint256 constant ROLE_NONE = 0;
    uint256 constant ROLE_ENABLED = 1;
    uint256 constant ROLE_ADMIN = 2;

    mapping(address => mapping(uint256 => uint256)) internal role;
    mapping(uint256 => CollectionInfo) public collections;  // Collection ID -> Collection Info
    uint256 public collectionCount; // The total number of collections


    struct CollectionInfo {
        address creator;
        string uri;
        uint256 totalSupply;
        uint256 maxTotalSupply;
    }

    event CollectionCreated(
        uint256 id,
        address creator,
        string uri,
        uint256 maxTotalSupply
    );

    event UriSet(
        uint256 collectionId,
        string newUri
    );


    constructor() ERC1155("") {}

    /**
     * @notice Creates new collection with specified parameters
     * @dev Only backend can call it
     * @param _creator The creator address
     * @param _uri The link to tokens' metadata
     * @param _maxTotalSupply Max available total supply
     */
    function createCollection(
        address _creator,
        string memory _uri,
        uint256 _maxTotalSupply
    ) external onlyOwner {
        require(_creator != address(0), "creator is zero");
        require(bytes(_uri).length != 0, "incorrect URI");
        require(_maxTotalSupply > 0, "incorrect max supply");
        uint256 collectionCount_ = collectionCount;
        collections[collectionCount_].creator = _creator;
        collections[collectionCount_].uri = _uri;
        collections[collectionCount_].maxTotalSupply = _maxTotalSupply;
        uint256 collectionId = collectionCount++;
        role[_creator][collectionId] = ROLE_ADMIN;
        emit CollectionCreated(
            collectionId,
            _creator, 
            _uri,
            _maxTotalSupply
        );
    }

    /**
     * @notice Sets a new URI fo the collection
     * @dev Only backend can call it
     * @param _collectionId The collection ID
     * @param _newUri New URI
     */
    function setUri(uint256 _collectionId, string memory _newUri) external onlyOwner {
        collections[_collectionId].uri = _newUri;
        emit UriSet(_collectionId, _newUri);
    }



    ////////////////////////////////////////////////////////////////////////////////
    // IMinter Implementation
    ////////////////////////////////////////////////////////////////////////////////

    // Set [addr] to have the admin role over the minter list
    function setAdmin(address addr, uint256 id) external override {
        require(
            role[msg.sender][id] == ROLE_ADMIN || msg.sender == owner(),
            "Only an admin can set an admin role"
        );
        require(
            addr != owner(),
            "Role for the owner cannot be set"
        );
        role[addr][id] = ROLE_ADMIN;
    }

    // Set [addr] to be enabled on the minter list
    function setEnabled(address addr, uint256 id) external override {
        require(
            role[msg.sender][id] == ROLE_ADMIN || msg.sender == owner(),
            "Only an admin can enable a minter"
        );
        require(
            addr != owner(),
            "Role for the owner cannot be set"
        );
        role[addr][id] = ROLE_ENABLED;
    }

    // Set [addr] to have no role over the minter list
    function setNone(address addr, uint256 id) external override {
        require(
            role[msg.sender][id] == ROLE_ADMIN || msg.sender == owner(),
            "Only an admin can set roles"
        );
        require(
            addr != owner(),
            "Role for the owner cannot be set"
        );
        role[addr][id] = ROLE_NONE;
    }

    // Read the status of [addr]
    // returns an integer representing the role of the address
    // 0: none, 1: minter, 2: admin
    function readAllowList(address addr, uint256 id)
        external
        view
        override
        returns (uint256)
    {
        if (addr == owner()) {
            return ROLE_ADMIN;
        }
 
        return role[addr][id];
    }


    // Mint [amount] number of tokens from collection [id] and send to [addr]
    function mintToken(address addr, uint256 id, uint256 amount) external override {
        require(
            role[msg.sender][id] == ROLE_ENABLED || role[msg.sender][id] == ROLE_ADMIN || msg.sender == owner(),
            "Only allowed minters can mint tokens"
        );
        require(id < collectionCount, "incorrect ID");
        collections[id].totalSupply += amount;
        require(collections[id].totalSupply < collections[id].maxTotalSupply, "max supply exceeded");
        _mint(addr, id, amount, "");
    }

    /**
     * @notice The standart function to get collection's URI
     * @param _collectionId The collection ID
     */
    function uri(uint256 _collectionId) public view virtual override returns (string memory) {
        require(_collectionId < collectionCount, "incorrect collection ID");
        return collections[_collectionId].uri;
    }
   
}

