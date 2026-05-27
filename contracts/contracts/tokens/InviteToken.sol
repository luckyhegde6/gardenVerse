// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract InviteToken is ERC721, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 private _nextTokenId;
    mapping(address => uint256) public userInviteToken;

    event InviteIssued(address indexed user, uint256 tokenId);
    event InviteUsed(address indexed user, uint256 tokenId);

    constructor() ERC721("GardenVerse Invite", "GVINV") {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    function issueInvite(address user) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(user != address(0), "Invalid address");
        require(balanceOf(user) == 0, "User already has an invite");

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;
        _safeMint(user, tokenId);
        userInviteToken[user] = tokenId;

        emit InviteIssued(user, tokenId);
        return tokenId;
    }

    function useInvite(address user) external onlyRole(ADMIN_ROLE) {
        require(balanceOf(user) > 0, "No invite token");
        uint256 tokenId = userInviteToken[user];
        _burn(tokenId);
        delete userInviteToken[user];
        emit InviteUsed(user, tokenId);
    }

    function verifyEligibility(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    function getInviteToken(address user) external view returns (uint256) {
        require(balanceOf(user) > 0, "No invite token");
        return userInviteToken[user];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("InviteToken: soulbound - non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}
