// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Escrow.sol";

contract Marketplace is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant PLATFORM_FEE_BPS = 200;

    enum ListingStatus { Active, Sold, Cancelled, Disputed }

    struct Listing {
        address seller;
        address tokenAddress;
        uint256 price;
        uint256 quantity;
        ListingStatus status;
        uint256 createdAt;
        address buyer;
    }

    uint256 public listingCounter;
    mapping(uint256 => Listing) public listings;
    Escrow public escrow;

    event ItemListed(uint256 indexed listingId, address indexed seller, address tokenAddress, uint256 price, uint256 quantity, uint256 timestamp);
    event ItemPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price, uint256 quantity, uint256 timestamp);
    event ItemCancelled(uint256 indexed listingId, address indexed seller, uint256 timestamp);
    event DisputeRaised(uint256 indexed listingId, address indexed buyer, uint256 timestamp);
    event DisputeResolved(uint256 indexed listingId, address indexed resolver, bool refundBuyer, uint256 timestamp);

    constructor(address escrowAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        escrow = Escrow(escrowAddress);
    }

    function listItem(address tokenAddress, uint256 price, uint256 quantity) external returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(quantity > 0, "Quantity must be greater than 0");
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(_msgSender(), address(this), quantity), "Transfer failed");

        listingCounter++;
        uint256 listingId = listingCounter;

        listings[listingId] = Listing({
            seller: _msgSender(),
            tokenAddress: tokenAddress,
            price: price,
            quantity: quantity,
            status: ListingStatus.Active,
            createdAt: block.timestamp,
            buyer: address(0)
        });

        emit ItemListed(listingId, _msgSender(), tokenAddress, price, quantity, block.timestamp);
        return listingId;
    }

    function buyItem(uint256 listingId, uint256 quantity) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(quantity > 0 && quantity <= listing.quantity, "Invalid quantity");
        require(msg.value >= listing.price * quantity, "Insufficient payment");

        uint256 totalPrice = listing.price * quantity;
        uint256 fee = (totalPrice * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerAmount = totalPrice - fee;

        listing.status = ListingStatus.Sold;
        listing.buyer = _msgSender();

        IERC20(listing.tokenAddress).transfer(_msgSender(), quantity);

        if (sellerAmount > 0) {
            (bool sent, ) = payable(listing.seller).call{value: sellerAmount}("");
            require(sent, "Payment to seller failed");
        }

        uint256 excess = msg.value - totalPrice;
        if (excess > 0) {
            (bool refunded, ) = payable(_msgSender()).call{value: excess}("");
            require(refunded, "Refund of excess failed");
        }

        emit ItemPurchased(listingId, _msgSender(), listing.seller, totalPrice, quantity, block.timestamp);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == _msgSender(), "Not the seller");
        require(listing.status == ListingStatus.Active, "Listing not active");

        listing.status = ListingStatus.Cancelled;

        IERC20(listing.tokenAddress).transfer(listing.seller, listing.quantity);

        emit ItemCancelled(listingId, _msgSender(), block.timestamp);
    }

    function raiseDispute(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.buyer == _msgSender(), "Not the buyer");
        require(listing.status == ListingStatus.Sold, "Not sold yet");

        listing.status = ListingStatus.Disputed;

        emit DisputeRaised(listingId, _msgSender(), block.timestamp);
    }

    function resolveDispute(uint256 listingId, bool refundBuyer) external onlyRole(ADMIN_ROLE) nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Disputed, "Not disputed");

        listing.status = ListingStatus.Sold;

        emit DisputeResolved(listingId, _msgSender(), refundBuyer, block.timestamp);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
}
