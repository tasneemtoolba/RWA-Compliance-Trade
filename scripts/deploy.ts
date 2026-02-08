import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy UserRegistry
  console.log("\nDeploying UserRegistry...");
  const UserRegistryFactory = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistryFactory.deploy(deployer.address);
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("UserRegistry deployed to:", userRegistryAddress);

  // Deploy FHEVerifier
  console.log("\nDeploying FHEVerifier...");
  const FHEVerifierFactory = await ethers.getContractFactory("FHEVerifier");
  const fheVerifier = await FHEVerifierFactory.deploy();
  await fheVerifier.waitForDeployment();
  const fheVerifierAddress = await fheVerifier.getAddress();
  console.log("FHEVerifier deployed to:", fheVerifierAddress);

  // Deploy ComplianceHook
  console.log("\nDeploying ComplianceHook...");
  const ComplianceHookFactory = await ethers.getContractFactory("ComplianceHook");
  const complianceHook = await ComplianceHookFactory.deploy(
    deployer.address,
    userRegistryAddress,
    fheVerifierAddress
  );
  await complianceHook.waitForDeployment();
  const complianceHookAddress = await complianceHook.getAddress();
  console.log("ComplianceHook deployed to:", complianceHookAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      UserRegistry: userRegistryAddress,
      FHEVerifier: fheVerifierAddress,
      ComplianceHook: complianceHookAddress,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Write to file
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", deploymentPath);

  // Configure demo pool rule mask
  console.log("\nConfiguring demo pool rule mask...");
  const DEMO_POOL_ID = ethers.keccak256(ethers.toUtf8Bytes("CLOAKSWAP_DEMO_POOL_V1"));
  // Example rule: accredited (bit 0) + EU (bit 1) + bucket 1K (bit 11)
  // In binary: 0b10000000011 = 0x403 = 1027
  const RULE_MASK = BigInt("0x403"); // accredited | EU | bucket1k
  
  try {
    const tx = await complianceHook.setPoolRuleMask(DEMO_POOL_ID, RULE_MASK);
    await tx.wait();
    console.log("Pool rule mask configured:", RULE_MASK.toString());
    console.log("Demo pool ID:", DEMO_POOL_ID);
  } catch (error) {
    console.error("Failed to set pool rule mask:", error);
    console.log("⚠️  You'll need to set it manually: hook.setPoolRuleMask(poolId, ruleMask)");
  }

  deploymentInfo.poolId = DEMO_POOL_ID;
  deploymentInfo.ruleMask = RULE_MASK.toString();

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Update contract addresses in frontend/src/lib/contracts.ts");
  console.log("2. Update poolId in frontend/src/lib/contracts.ts to:", DEMO_POOL_ID);
  console.log("3. Run seed-demo.ts to set up demo user profiles (optional)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
