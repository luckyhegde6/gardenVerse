const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationToken", function () {
  let RepToken, repToken, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    RepToken = await ethers.getContractFactory("ReputationToken");
    repToken = await RepToken.deploy();
    await repToken.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await repToken.name()).to.equal("GardenVerse Reputation");
    expect(await repToken.symbol()).to.equal("GVREP");
  });

  it("should mint badge", async function () {
    const tx = await repToken.mintBadge(addr1.address, 0, "ipfs://bronze-badge.json");
    const receipt = await tx.wait();
    expect(await repToken.balanceOf(addr1.address)).to.equal(1);
  });

  it("should not allow transfer", async function () {
    await repToken.mintBadge(addr1.address, 0, "ipfs://badge.json");
    await expect(
      repToken.connect(addr1).transferFrom(addr1.address, owner.address, 1)
    ).to.be.revertedWith("ReputationToken: soulbound - non-transferable");
  });

  it("should return user badges", async function () {
    await repToken.mintBadge(addr1.address, 0, "ipfs://bronze.json");
    await repToken.mintBadge(addr1.address, 2, "ipfs://gold.json");
    const badges = await repToken.getUserBadges(addr1.address);
    expect(badges.length).to.equal(2);
  });

  it("should level up badge", async function () {
    await repToken.mintBadge(addr1.address, 0, "ipfs://bronze.json");
    await repToken.levelUpBadge(1, 1, "ipfs://silver.json");
    const badge = await repToken.getBadge(1);
    expect(badge.level).to.equal(1);
  });

  it("should not level down", async function () {
    await repToken.mintBadge(addr1.address, 3, "ipfs://platinum.json");
    await expect(
      repToken.levelUpBadge(1, 0, "ipfs://bronze.json")
    ).to.be.revertedWith("New level must be higher");
  });
});

describe("ReputationManager", function () {
  let RepManager, repManager, owner, oracle, user;

  beforeEach(async function () {
    [owner, oracle, user] = await ethers.getSigners();
    RepManager = await ethers.getContractFactory("ReputationManager");
    repManager = await RepManager.deploy();
    await repManager.waitForDeployment();
    await repManager.grantOracleRole(oracle.address);
  });

  it("should update score", async function () {
    await repManager.connect(oracle).updateScore(user.address, 250, "0x");
    const rep = await repManager.getReputation(user.address);
    expect(rep.score).to.equal(250);
  });

  it("should calculate rank correctly", async function () {
    await repManager.connect(oracle).updateScore(user.address, 600, "0x");
    const rank = await repManager.getRank(user.address);
    expect(rank).to.equal(1);
  });

  it("should return grandmaster at 10000+", async function () {
    await repManager.connect(oracle).updateScore(user.address, 15000, "0x");
    const rank = await repManager.getRank(user.address);
    expect(rank).to.equal(4);
  });

  it("should verify score with proof", async function () {
    await repManager.connect(oracle).updateScore(user.address, 500, "0x1234");
    const valid = await repManager.verifyScore(user.address, 500, "0x1234");
    expect(valid).to.be.true;
  });

  it("should reject non-oracle updates", async function () {
    await expect(
      repManager.connect(user).updateScore(user.address, 100, "0x")
    ).to.be.revertedWithCustomError;
  });
});

describe("RewardDistributor", function () {
  let RewardDist, GCT, rewardDist, gct;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    GCT = await ethers.getContractFactory("GreenCreditToken");
    gct = await GCT.deploy(owner.address);
    await gct.waitForDeployment();

    RewardDist = await ethers.getContractFactory("RewardDistributor");
    rewardDist = await RewardDist.deploy();
    await rewardDist.waitForDeployment();

    await gct.mint(owner.address, 10000);
    await gct.approve(await rewardDist.getAddress(), 10000);
  });

  it("should create reward", async function () {
    const merkleRoot = ethers.keccak256("0x1234");
    await rewardDist.createReward(await gct.getAddress(), 1000, merkleRoot);
    const reward = await rewardDist.getReward(1);
    expect(reward.totalAmount).to.equal(1000);
    expect(reward.active).to.be.true;
  });

  it("should not create reward with zero amount", async function () {
    await expect(
      rewardDist.createReward(await gct.getAddress(), 0, ethers.keccak256("0x12"))
    ).to.be.revertedWith("Amount must be greater than 0");
  });

  it("should deactivate reward", async function () {
    const merkleRoot = ethers.keccak256("0x1234");
    await rewardDist.createReward(await gct.getAddress(), 1000, merkleRoot);
    await rewardDist.deactivateReward(1);
    const reward = await rewardDist.getReward(1);
    expect(reward.active).to.be.false;
  });
});
