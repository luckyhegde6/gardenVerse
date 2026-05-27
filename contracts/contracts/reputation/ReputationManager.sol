// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReputationManager is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum ReputationRank { Newcomer, Gardener, Horticulturist, MasterGardener, Grandmaster }

    struct Reputation {
        uint256 score;
        uint256 lastUpdated;
        ReputationRank rank;
    }

    mapping(address => Reputation) public reputations;

    event ScoreUpdated(address indexed user, uint256 newScore, uint256 previousScore, ReputationRank rank);
    event RankChanged(address indexed user, ReputationRank newRank, ReputationRank oldRank);

    uint256 public constant BRONZE_THRESHOLD = 100;
    uint256 public constant SILVER_THRESHOLD = 500;
    uint256 public constant GOLD_THRESHOLD = 1000;
    uint256 public constant PLATINUM_THRESHOLD = 5000;
    uint256 public constant DIAMOND_THRESHOLD = 10000;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    function updateScore(address user, uint256 newScore, bytes calldata /*proof*/) external onlyRole(ORACLE_ROLE) {
        require(user != address(0), "Invalid address");

        Reputation storage rep = reputations[user];
        uint256 oldScore = rep.score;
        ReputationRank oldRank = rep.rank;

        rep.score = newScore;
        rep.lastUpdated = block.timestamp;
        rep.rank = _calculateRank(newScore);

        emit ScoreUpdated(user, newScore, oldScore, rep.rank);

        if (rep.rank != oldRank) {
            emit RankChanged(user, rep.rank, oldRank);
        }
    }

    function getScore(address user) external view returns (uint256) {
        return reputations[user].score;
    }

    function getRank(address user) external view returns (ReputationRank) {
        return reputations[user].rank;
    }

    function getReputation(address user) external view returns (Reputation memory) {
        return reputations[user];
    }

    function _calculateRank(uint256 score) private pure returns (ReputationRank) {
        if (score >= DIAMOND_THRESHOLD) return ReputationRank.Grandmaster;
        if (score >= PLATINUM_THRESHOLD) return ReputationRank.MasterGardener;
        if (score >= GOLD_THRESHOLD) return ReputationRank.Horticulturist;
        if (score >= SILVER_THRESHOLD) return ReputationRank.Gardener;
        if (score >= BRONZE_THRESHOLD) return ReputationRank.Newcomer;
        return ReputationRank.Newcomer;
    }

    function grantOracleRole(address oracle) external onlyRole(ADMIN_ROLE) {
        _grantRole(ORACLE_ROLE, oracle);
    }

    function revokeOracleRole(address oracle) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ORACLE_ROLE, oracle);
    }

    function verifyScore(address user, uint256 score, bytes calldata proof) external view returns (bool) {
        return reputations[user].score == score && keccak256(proof) != keccak256("");
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
