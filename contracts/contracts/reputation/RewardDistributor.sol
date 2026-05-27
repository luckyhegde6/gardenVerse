// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RewardDistributor is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Reward {
        bytes32 merkleRoot;
        IERC20 token;
        uint256 totalAmount;
        uint256 claimedAmount;
        bool active;
    }

    uint256 public rewardCounter;
    mapping(uint256 => Reward) public rewards;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event RewardCreated(uint256 indexed rewardId, address indexed token, uint256 totalAmount, bytes32 merkleRoot);
    event RewardClaimed(uint256 indexed rewardId, address indexed claimant, uint256 amount);
    event RewardDeactivated(uint256 indexed rewardId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    function createReward(IERC20 token, uint256 totalAmount, bytes32 merkleRoot) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(totalAmount > 0, "Amount must be greater than 0");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(address(token) != address(0), "Invalid token address");

        rewardCounter++;
        uint256 rewardId = rewardCounter;

        rewards[rewardId] = Reward({
            merkleRoot: merkleRoot,
            token: token,
            totalAmount: totalAmount,
            claimedAmount: 0,
            active: true
        });

        emit RewardCreated(rewardId, address(token), totalAmount, merkleRoot);
        return rewardId;
    }

    function claimReward(uint256 rewardId, uint256 amount, bytes32[] calldata merkleProof) external nonReentrant {
        Reward storage reward = rewards[rewardId];
        require(reward.active, "Reward not active");
        require(!hasClaimed[rewardId][_msgSender()], "Already claimed");
        require(reward.claimedAmount + amount <= reward.totalAmount, "Exceeds total reward");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_msgSender(), amount))));
        require(MerkleProof.verify(merkleProof, reward.merkleRoot, leaf), "Invalid merkle proof");

        hasClaimed[rewardId][_msgSender()] = true;
        reward.claimedAmount += amount;

        require(reward.token.transfer(_msgSender(), amount), "Transfer failed");

        emit RewardClaimed(rewardId, _msgSender(), amount);
    }

    function verifyClaim(uint256 rewardId, address claimant, uint256 amount, bytes32[] calldata merkleProof) external view returns (bool) {
        Reward storage reward = rewards[rewardId];
        if (!reward.active) return false;
        if (hasClaimed[rewardId][claimant]) return false;

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(claimant, amount))));
        return MerkleProof.verify(merkleProof, reward.merkleRoot, leaf);
    }

    function deactivateReward(uint256 rewardId) external onlyRole(ADMIN_ROLE) {
        Reward storage reward = rewards[rewardId];
        require(reward.active, "Already inactive");
        reward.active = false;
        emit RewardDeactivated(rewardId);
    }

    function withdrawRemaining(uint256 rewardId, address to) external onlyRole(ADMIN_ROLE) {
        Reward storage reward = rewards[rewardId];
        require(!reward.active, "Reward still active");
        uint256 remaining = reward.totalAmount - reward.claimedAmount;
        require(remaining > 0, "Nothing to withdraw");
        require(reward.token.transfer(to, remaining), "Transfer failed");
    }

    function getReward(uint256 rewardId) external view returns (Reward memory) {
        return rewards[rewardId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
