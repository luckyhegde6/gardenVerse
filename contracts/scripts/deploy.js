const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const GreenCreditToken = await hre.ethers.getContractFactory("GreenCreditToken");
  const greenCreditToken = await GreenCreditToken.deploy(deployer.address);
  await greenCreditToken.waitForDeployment();
  console.log("GreenCreditToken deployed to:", await greenCreditToken.getAddress());

  const EcoPointToken = await hre.ethers.getContractFactory("EcoPointToken");
  const ecoPointToken = await EcoPointToken.deploy();
  await ecoPointToken.waitForDeployment();
  console.log("EcoPointToken deployed to:", await ecoPointToken.getAddress());

  const ReputationToken = await hre.ethers.getContractFactory("ReputationToken");
  const reputationToken = await ReputationToken.deploy();
  await reputationToken.waitForDeployment();
  console.log("ReputationToken deployed to:", await reputationToken.getAddress());

  const InviteToken = await hre.ethers.getContractFactory("InviteToken");
  const inviteToken = await InviteToken.deploy();
  await inviteToken.waitForDeployment();
  console.log("InviteToken deployed to:", await inviteToken.getAddress());

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log("Escrow deployed to:", await escrow.getAddress());

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(await escrow.getAddress());
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", await marketplace.getAddress());

  const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");
  const reputationManager = await ReputationManager.deploy();
  await reputationManager.waitForDeployment();
  console.log("ReputationManager deployed to:", await reputationManager.getAddress());

  const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy();
  await rewardDistributor.waitForDeployment();
  console.log("RewardDistributor deployed to:", await rewardDistributor.getAddress());

  await ecoPointToken.grantReputationRole(await reputationManager.getAddress());
  console.log("Granted REPUTATION_CONTRACT role to ReputationManager");

  await escrow.grantMarketplaceRole(await marketplace.getAddress());
  console.log("Granted MARKETPLACE_ROLE to Marketplace");

  console.log("\n=== Deployment Summary ===");
  console.log("GreenCreditToken:", await greenCreditToken.getAddress());
  console.log("EcoPointToken:", await ecoPointToken.getAddress());
  console.log("ReputationToken:", await reputationToken.getAddress());
  console.log("InviteToken:", await inviteToken.getAddress());
  console.log("Escrow:", await escrow.getAddress());
  console.log("Marketplace:", await marketplace.getAddress());
  console.log("ReputationManager:", await reputationManager.getAddress());
  console.log("RewardDistributor:", await rewardDistributor.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
