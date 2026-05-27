const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let Marketplace, Escrow, GCT, marketplace, escrow, gct;
  let owner, seller, buyer, addr3;

  beforeEach(async function () {
    [owner, seller, buyer, addr3] = await ethers.getSigners();

    GCT = await ethers.getContractFactory("GreenCreditToken");
    gct = await GCT.deploy(owner.address);
    await gct.waitForDeployment();

    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(await escrow.getAddress());
    await marketplace.waitForDeployment();

    await escrow.grantMarketplaceRole(await marketplace.getAddress());

    await gct.mint(seller.address, 10000);
    await gct.connect(seller).approve(await marketplace.getAddress(), 10000);
  });

  describe("Listing", function () {
    it("should list an item", async function () {
      const tx = await marketplace.connect(seller).listItem(await gct.getAddress(), 10, 100);
      const receipt = await tx.wait();

      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(10);
      expect(listing.quantity).to.equal(100);
    });

    it("should not list with zero price", async function () {
      await expect(
        marketplace.connect(seller).listItem(await gct.getAddress(), 0, 100)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("should not list without approval", async function () {
      await gct.connect(seller).approve(await marketplace.getAddress(), 0);
      await expect(
        marketplace.connect(seller).listItem(await gct.getAddress(), 10, 100)
      ).to.be.reverted;
    });
  });

  describe("Purchasing", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listItem(await gct.getAddress(), 10, 100);
    });

    it("should purchase an item", async function () {
      const totalPrice = 10n * 50n;
      const fee = (totalPrice * 200n) / 10000n;
      const sellerAmount = totalPrice - fee;

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      await marketplace.connect(buyer).buyItem(1, 50, { value: totalPrice });

      expect(await gct.balanceOf(buyer.address)).to.equal(50);

      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(1);
    });

    it("should revert with insufficient payment", async function () {
      await expect(
        marketplace.connect(buyer).buyItem(1, 100, { value: 500 })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Cancellation", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listItem(await gct.getAddress(), 10, 100);
    });

    it("should cancel listing", async function () {
      await marketplace.connect(seller).cancelListing(1);
      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(2);
    });

    it("should not allow non-seller to cancel", async function () {
      await expect(marketplace.connect(buyer).cancelListing(1)).to.be.revertedWith("Not the seller");
    });
  });

  describe("Disputes", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listItem(await gct.getAddress(), 10, 100);
      await marketplace.connect(buyer).buyItem(1, 100, { value: 1000 });
    });

    it("should raise a dispute", async function () {
      await marketplace.connect(buyer).raiseDispute(1);
      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(3);
    });

    it("should resolve dispute (refund buyer)", async function () {
      const listingBefore = await marketplace.getListing(1);
      expect(listingBefore.status).to.equal(1);
      await marketplace.connect(buyer).raiseDispute(1);
      await marketplace.resolveDispute(1, true);
      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(1);
    });
  });
});

describe("Escrow", function () {
  let Escrow, escrow, owner, marketplace, seller, buyer;

  beforeEach(async function () {
    [owner, marketplace, seller, buyer] = await ethers.getSigners();
    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();
    await escrow.grantMarketplaceRole(marketplace.address);
  });

  it("should create escrow", async function () {
    await escrow.connect(marketplace).createEscrow(buyer.address, seller.address, { value: 100 });
    const agreement = await escrow.getEscrow(1);
    expect(agreement.amount).to.equal(100);
    expect(agreement.status).to.equal(0);
  });

  it("should release funds", async function () {
    await escrow.connect(marketplace).createEscrow(buyer.address, seller.address, { value: 100 });
    await escrow.connect(marketplace).release(1);
    const agreement = await escrow.getEscrow(1);
    expect(agreement.status).to.equal(1);
  });

  it("should refund buyer", async function () {
    await escrow.connect(marketplace).createEscrow(buyer.address, seller.address, { value: 100 });
    await escrow.connect(marketplace).refund(1);
    const agreement = await escrow.getEscrow(1);
    expect(agreement.status).to.equal(2);
  });
});
