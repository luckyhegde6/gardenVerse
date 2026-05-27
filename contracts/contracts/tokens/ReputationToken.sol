// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReputationToken is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    enum BadgeLevel { Bronze, Silver, Gold, Platinum, Diamond }

    struct Badge {
        BadgeLevel level;
        uint256 score;
        string metadata;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => Badge) private _badges;
    mapping(address => uint256[]) private _userBadges;

    event BadgeMinted(address indexed to, uint256 tokenId, BadgeLevel level, string metadataURI);
    event BadgeLevelUp(address indexed user, uint256 tokenId, BadgeLevel newLevel);

    constructor() ERC721("GardenVerse Reputation", "GVREP") {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(MINTER_ROLE, _msgSender());
    }

    function mintBadge(address to, BadgeLevel level, string calldata metadataURI) external onlyRole(MINTER_ROLE) returns (uint256) {
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _badges[tokenId] = Badge(level, 0, metadataURI);
        _userBadges[to].push(tokenId);
        emit BadgeMinted(to, tokenId, level, metadataURI);
        return tokenId;
    }

    function getUserBadges(address user) external view returns (uint256[] memory) {
        return _userBadges[user];
    }

    function getBadge(uint256 tokenId) external view returns (Badge memory) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        return _badges[tokenId];
    }

    function getBadgeLevel(uint256 tokenId) external view returns (BadgeLevel) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        return _badges[tokenId].level;
    }

    function levelUpBadge(uint256 tokenId, BadgeLevel newLevel, string calldata newMetadataURI) external onlyRole(MINTER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        require(uint8(newLevel) > uint8(_badges[tokenId].level), "New level must be higher");
        Badge storage badge = _badges[tokenId];
        badge.level = newLevel;
        badge.metadata = newMetadataURI;
        _setTokenURI(tokenId, newMetadataURI);
        emit BadgeLevelUp(ownerOf(tokenId), tokenId, newLevel);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("ReputationToken: soulbound - non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
