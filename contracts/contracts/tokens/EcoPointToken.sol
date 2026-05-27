// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract EcoPointToken is ERC20, AccessControl {
    bytes32 public constant REPUTATION_CONTRACT = keccak256("REPUTATION_CONTRACT");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event PointsAwarded(address indexed to, uint256 amount, string reason);

    constructor() ERC20("Eco Point", "ECOP") {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    function awardPoints(address to, uint256 amount, string calldata reason) external onlyRole(REPUTATION_CONTRACT) {
        _mint(to, amount);
        emit PointsAwarded(to, amount, reason);
    }

    function checkBalance(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    function grantReputationRole(address reputationContract) external onlyRole(ADMIN_ROLE) {
        _grantRole(REPUTATION_CONTRACT, reputationContract);
    }

    function revokeReputationRole(address reputationContract) external onlyRole(ADMIN_ROLE) {
        _revokeRole(REPUTATION_CONTRACT, reputationContract);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            revert("EcoPointToken: non-transferable - soulbound token");
        }
        super._update(from, to, value);
    }
}
