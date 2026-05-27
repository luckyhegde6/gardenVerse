// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");

    enum EscrowStatus { Pending, Released, Refunded, Expired }

    struct EscrowAgreement {
        address buyer;
        address seller;
        uint256 amount;
        uint256 deadline;
        EscrowStatus status;
    }

    uint256 public escrowCounter;
    mapping(uint256 => EscrowAgreement) public agreements;
    uint256 public constant TIMEOUT_DURATION = 7 days;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline);
    event EscrowReleased(uint256 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowExpired(uint256 indexed escrowId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    function grantMarketplaceRole(address marketplace) external onlyRole(ADMIN_ROLE) {
        _grantRole(MARKETPLACE_ROLE, marketplace);
    }

    function createEscrow(address buyer, address seller) external payable onlyRole(MARKETPLACE_ROLE) returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(buyer != address(0) && seller != address(0), "Invalid addresses");

        escrowCounter++;
        uint256 escrowId = escrowCounter;

        agreements[escrowId] = EscrowAgreement({
            buyer: buyer,
            seller: seller,
            amount: msg.value,
            deadline: block.timestamp + TIMEOUT_DURATION,
            status: EscrowStatus.Pending
        });

        emit EscrowCreated(escrowId, buyer, seller, msg.value, block.timestamp + TIMEOUT_DURATION);
        return escrowId;
    }

    function release(uint256 escrowId) external onlyRole(MARKETPLACE_ROLE) nonReentrant {
        EscrowAgreement storage agreement = agreements[escrowId];
        require(agreement.status == EscrowStatus.Pending, "Escrow not pending");

        agreement.status = EscrowStatus.Released;

        (bool sent, ) = payable(agreement.seller).call{value: agreement.amount}("");
        require(sent, "Release to seller failed");

        emit EscrowReleased(escrowId, agreement.seller, agreement.amount);
    }

    function refund(uint256 escrowId) external onlyRole(MARKETPLACE_ROLE) nonReentrant {
        EscrowAgreement storage agreement = agreements[escrowId];
        require(agreement.status == EscrowStatus.Pending, "Escrow not pending");

        agreement.status = EscrowStatus.Refunded;

        (bool sent, ) = payable(agreement.buyer).call{value: agreement.amount}("");
        require(sent, "Refund to buyer failed");

        emit EscrowRefunded(escrowId, agreement.buyer, agreement.amount);
    }

    function claimExpired(uint256 escrowId) external nonReentrant {
        EscrowAgreement storage agreement = agreements[escrowId];
        require(agreement.status == EscrowStatus.Pending, "Escrow not pending");
        require(block.timestamp > agreement.deadline, "Deadline not passed");

        agreement.status = EscrowStatus.Expired;

        (bool sent, ) = payable(agreement.seller).call{value: agreement.amount}("");
        require(sent, "Expired claim transfer failed");

        emit EscrowExpired(escrowId);
    }

    function getEscrow(uint256 escrowId) external view returns (EscrowAgreement memory) {
        return agreements[escrowId];
    }
}
