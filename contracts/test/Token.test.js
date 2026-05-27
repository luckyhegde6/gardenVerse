const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GreenCreditToken", function () {
  let GCT, gct, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    GCT = await ethers.getContractFactory("GreenCreditToken");
    gct = await GCT.deploy(owner.address);
    await gct.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await gct.name()).to.equal("Green Credit Token");
    expect(await gct.symbol()).to.equal("GCT");
  });

  it("should mint tokens (admin only)", async function () {
    await gct.mint(addr1.address, 1000);
    expect(await gct.balanceOf(addr1.address)).to.equal(1000);
  });

  it("should not allow non-admin to mint", async function () {
    await expect(gct.connect(addr1).mint(addr2.address, 100)).to.be.revertedWithCustomError;
  });

  it("should burn tokens", async function () {
    await gct.mint(addr1.address, 1000);
    await gct.connect(addr1).burn(500);
    expect(await gct.balanceOf(addr1.address)).to.equal(500);
  });

  it("should pause and unpause", async function () {
    await gct.pause();
    await expect(gct.mint(addr1.address, 100)).to.be.reverted;
    await gct.unpause();
    await gct.mint(addr1.address, 100);
    expect(await gct.balanceOf(addr1.address)).to.equal(100);
  });

  it("should transfer with metadata", async function () {
    await gct.mint(owner.address, 1000);
    await gct.transferWithMetadata(addr1.address, 500, "reward for planting trees");
    expect(await gct.balanceOf(addr1.address)).to.equal(500);
  });

  it("should support permit (ERC20Permit)", async function () {
    const [signer] = await ethers.getSigners();
    const name = await gct.name();
    const version = "1";
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const nonce = await gct.nonces(owner.address);

    const deadline = ethers.MaxUint256;
    const value = 100;

    const domain = {
      name,
      version,
      chainId,
      verifyingContract: await gct.getAddress(),
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      owner: owner.address,
      spender: addr1.address,
      value,
      nonce,
      deadline,
    };

    const signature = await owner.signTypedData(domain, types, message);
    const sig = ethers.Signature.from(signature);

    await gct.mint(owner.address, 1000);
    await gct.permit(owner.address, addr1.address, value, deadline, sig.v, sig.r, sig.s);
    expect(await gct.allowance(owner.address, addr1.address)).to.equal(value);
  });
});

describe("EcoPointToken", function () {
  let EcoPoint, ecoPoint, owner, addr1, repContract;

  beforeEach(async function () {
    [owner, addr1, repContract] = await ethers.getSigners();
    EcoPoint = await ethers.getContractFactory("EcoPointToken");
    ecoPoint = await EcoPoint.deploy();
    await ecoPoint.waitForDeployment();
    await ecoPoint.grantReputationRole(repContract.address);
  });

  it("should have correct name and symbol", async function () {
    expect(await ecoPoint.name()).to.equal("Eco Point");
    expect(await ecoPoint.symbol()).to.equal("ECOP");
  });

  it("should award points from reputation contract", async function () {
    await ecoPoint.connect(repContract).awardPoints(addr1.address, 500, "completed quest");
    expect(await ecoPoint.checkBalance(addr1.address)).to.equal(500);
  });

  it("should not allow transfer", async function () {
    await ecoPoint.connect(repContract).awardPoints(addr1.address, 500, "test");
    await expect(ecoPoint.connect(addr1).transfer(owner.address, 100)).to.be.revertedWith(
      "EcoPointToken: non-transferable - soulbound token"
    );
  });

  it("should not allow non-reputation to award", async function () {
    await expect(ecoPoint.connect(addr1).awardPoints(addr1.address, 100, "test")).to.be.revertedWithCustomError;
  });
});

describe("InviteToken", function () {
  let Invite, invite, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    Invite = await ethers.getContractFactory("InviteToken");
    invite = await Invite.deploy();
    await invite.waitForDeployment();
  });

  it("should issue invite", async function () {
    await invite.issueInvite(addr1.address);
    expect(await invite.balanceOf(addr1.address)).to.equal(1);
  });

  it("should verify eligibility", async function () {
    await invite.issueInvite(addr1.address);
    expect(await invite.verifyEligibility(addr1.address)).to.be.true;
  });

  it("should use invite", async function () {
    await invite.issueInvite(addr1.address);
    await invite.useInvite(addr1.address);
    expect(await invite.balanceOf(addr1.address)).to.equal(0);
  });

  it("should not transfer invite", async function () {
    await invite.issueInvite(addr1.address);
    await expect(invite.connect(addr1).transferFrom(addr1.address, owner.address, 1)).to.be.revertedWith(
      "InviteToken: soulbound - non-transferable"
    );
  });
});
