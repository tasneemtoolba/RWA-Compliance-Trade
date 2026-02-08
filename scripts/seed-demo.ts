import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Seeding demo data with account:", deployer.address);

  // Read deployment addresses
  const deploymentPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployments.json not found. Run deploy.ts first.");
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { UserRegistry, FHEVerifier, ComplianceHook } = deploymentInfo.contracts;

  console.log("\nUsing contracts:");
  console.log("  UserRegistry:", UserRegistry);
  console.log("  FHEVerifier:", FHEVerifier);
  console.log("  ComplianceHook:", ComplianceHook);

  // Get contract instances
  const UserRegistryFactory = await ethers.getContractFactory("UserRegistry");
  const userRegistry = UserRegistryFactory.attach(UserRegistry);

  const ComplianceHookFactory = await ethers.getContractFactory("ComplianceHook");
  const complianceHook = ComplianceHookFactory.attach(ComplianceHook);

  // Demo addresses
  // User A: eligible (bitmap includes required bits)
  // User B: ineligible (bitmap missing required bits)
  const userA = process.env.USER_A_ADDRESS || "0x1111111111111111111111111111111111111111";
  const userB = process.env.USER_B_ADDRESS || "0x2222222222222222222222222222222222222222";

  // Rule bitmap: 0b0110 (requires bits 1 and 2)
  const ruleBitmap = 0b0110n;

  // User A bitmap: 0b1110 (has bits 1, 2, 3 - eligible)
  const userABitmap = 0b1110n;
  const userACiphertext = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256"],
    [userABitmap]
  );

  // User B bitmap: 0b0010 (has bit 1, missing bit 2 - ineligible)
  const userBBitmap = 0b0010n;
  const userBCiphertext = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256"],
    [userBBitmap]
  );

  // Set expiry (30 days from now)
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

  console.log("\n=== Setting up profiles ===");

  // Set profile for User A (eligible)
  console.log("\nSetting profile for User A (eligible)...");
  console.log("  Address:", userA);
  console.log("  Bitmap:", userABitmap.toString(2));
  console.log("  Ciphertext length:", userACiphertext.length);
  try {
      const txA = await userRegistry.setEncryptedProfileFor(
        userA,
        userACiphertext,
        Number(expiry)
      );
    await txA.wait();
    console.log("  ✅ Profile set. Tx:", txA.hash);
  } catch (error: any) {
    console.log("  ⚠️  Error (may already exist):", error.message);
  }

  // Set profile for User B (ineligible)
  console.log("\nSetting profile for User B (ineligible)...");
  console.log("  Address:", userB);
  console.log("  Bitmap:", userBBitmap.toString(2));
  console.log("  Ciphertext length:", userBCiphertext.length);
  try {
      const txB = await userRegistry.setEncryptedProfileFor(
        userB,
        userBCiphertext,
        Number(expiry)
      );
    await txB.wait();
    console.log("  ✅ Profile set. Tx:", txB.hash);
  } catch (error: any) {
    console.log("  ⚠️  Error (may already exist):", error.message);
  }

  console.log("\n=== Setting pool rule bitmap ===");
  console.log("Rule bitmap:", ruleBitmap.toString(2), `(0b${ruleBitmap.toString(2)})`);

  // Note: For MVP, we need a PoolKey to set the rule bitmap
  // In a real deployment, you would have the actual PoolKey from pool initialization
  // For demo purposes, we'll show how to set it if you have a PoolKey

  console.log("\n⚠️  To set pool rule bitmap, you need a PoolKey.");
  console.log("   Example (if you have a PoolKey):");
  console.log(`   await complianceHook.setPoolRuleMask(poolKey, ${ruleBitmap.toString()});`);

  // If you have a known PoolId, you could set it directly via storage manipulation
  // But for safety, we'll just document it here

  console.log("\n=== Demo Setup Summary ===");
  console.log("User A (eligible):");
  console.log("  Address:", userA);
  console.log("  Bitmap:", userABitmap.toString(2));
  console.log("  Expected: ✅ Eligible");

  console.log("\nUser B (ineligible):");
  console.log("  Address:", userB);
  console.log("  Bitmap:", userBBitmap.toString(2));
  console.log("  Expected: ❌ Not Eligible (missing bit 2)");

  console.log("\nRule Bitmap:", ruleBitmap.toString(2));
  console.log("  Requires: bits 1 and 2");

  console.log("\n✅ Demo seeding complete!");
  console.log("\nNext steps:");
  console.log("1. Set pool rule bitmap using setPoolRuleBitmap() with your PoolKey");
  console.log("2. Test swap with User A (should succeed)");
  console.log("3. Test swap with User B (should fail with NOT_ELIGIBLE)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
