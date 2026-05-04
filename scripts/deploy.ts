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

  // Configure pool rule mask (for demo/testing)
  // In production, set this for your actual Uniswap v4 pool ID
  console.log("\n=== Pool Configuration ===");
  const DEMO_POOL_ID = ethers.keccak256(ethers.toUtf8Bytes("CLOAKSWAP_DEMO_POOL_V1"));
  
  // Rule mask: accredited (bit 0) + EU (bit 1) + bucket >= 1000 (bit 3)
  // For demo bitmap encoder: bits 0, 1, 3
  // In binary: 0b1011 = 0xb = 11
  const RULE_MASK = BigInt("0xb"); // 0b1011 = accredited | EU | bucket>=1000
  
  try {
    const tx = await complianceHook.setPoolRuleMask(DEMO_POOL_ID, RULE_MASK);
    await tx.wait();
    console.log("✅ Pool rule mask configured");
    console.log("  Pool ID:", DEMO_POOL_ID);
    console.log("  Rule Mask:", RULE_MASK.toString(), `(0x${RULE_MASK.toString(16)})`);
    console.log("  Required: accredited (bit0) + EU (bit1) + bucket>=1000 (bit3)");
  } catch (error) {
    console.error("⚠️  Failed to set pool rule mask:", error);
    console.log("   Set manually: await complianceHook.setPoolRuleMask(poolId, ruleMask)");
  }

  deploymentInfo.poolId = DEMO_POOL_ID;
  deploymentInfo.ruleMask = RULE_MASK.toString();

  console.log("\n✅ Deployment complete!");
  console.log("\n=== Next Steps ===");
  console.log("1. Update contract addresses in frontend/src/lib/contracts.ts");
  console.log("2. Update poolId in frontend/src/lib/contracts.ts to:", DEMO_POOL_ID);
  console.log("3. For mainnet: Update NEXT_PUBLIC_* env vars with these addresses");
  console.log("\n=== Important Notes ===");
  console.log("⚠️  ComplianceHook is a simplified version for demo.");
  console.log("   For real Uniswap v4 integration, you need to:");
  console.log("   - Deploy hook to a mined address (flag 1<<7 for beforeSwap)");
  console.log("   - Inherit from BaseHook and implement proper v4 hook interface");
  console.log("   - Create a pool with this hook address");
  console.log("\n📝 Current setup works for:");
  console.log("   - Frontend eligibility checks (hook.check())");
  console.log("   - Demo compliance gating");
  console.log("   - Production-ready registry (supports bytes ciphertext for real FHE)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
