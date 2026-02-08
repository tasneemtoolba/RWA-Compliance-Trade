import { expect } from "chai";
import { ethers } from "hardhat";
import { UserRegistry } from "../typechain-types";
import { FHEVerifier } from "../typechain-types";
import { ComplianceHook } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ComplianceHook", function () {
  let userRegistry: UserRegistry;
  let fheVerifier: FHEVerifier;
  let complianceHook: ComplianceHook;
  let owner: SignerWithAddress;
  let userA: SignerWithAddress; // Eligible user
  let userB: SignerWithAddress; // Ineligible user

  beforeEach(async function () {
    [owner, userA, userB] = await ethers.getSigners();

    // Deploy UserRegistry
    const UserRegistryFactory = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistryFactory.deploy(owner.address);
    await userRegistry.waitForDeployment();

    // Deploy FHEVerifier
    const FHEVerifierFactory = await ethers.getContractFactory("FHEVerifier");
    fheVerifier = await FHEVerifierFactory.deploy();
    await fheVerifier.waitForDeployment();

    // Deploy ComplianceHook
    const ComplianceHookFactory = await ethers.getContractFactory("ComplianceHook");
    complianceHook = await ComplianceHookFactory.deploy(
      owner.address,
      await userRegistry.getAddress(),
      await fheVerifier.getAddress()
    );
    await complianceHook.waitForDeployment();
  });

  describe("Eligibility Predicate", function () {
    it("Should verify eligible user: (userBitmap & ruleBitmap) == ruleBitmap", async function () {
      // Rule bitmap: 0b0110 (requires bits 1 and 2)
      const ruleBitmap = 0b0110n;

      // User bitmap: 0b1110 (has bits 1, 2, 3 - includes required bits)
      const userBitmap = 0b1110n;

      // Encode user bitmap as ciphertext (mock: abi.encode(uint256))
      const ciphertext = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [userBitmap]
      );

      // Set expiry in future
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

      // Set profile for userA (using owner function for tests)
      await userRegistry.setEncryptedProfileFor(
        await userA.getAddress(),
        ciphertext,
        Number(expiry)
      );

      // Verify eligibility directly via verifier
      const eligible = await fheVerifier.verify(ciphertext, ruleBitmap);
      expect(eligible).to.be.true;
    });

    it("Should reject ineligible user: missing required bits", async function () {
      // Rule bitmap: 0b0110 (requires bits 1 and 2)
      const ruleBitmap = 0b0110n;

      // User bitmap: 0b0010 (has bit 1, missing bit 2)
      const userBitmap = 0b0010n;

      // Encode user bitmap as ciphertext
      const ciphertext = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [userBitmap]
      );

      // Verify should return false
      const eligible = await fheVerifier.verify(ciphertext, ruleBitmap);
      expect(eligible).to.be.false;
    });
  });

  describe("ComplianceHook Checks", function () {
    it("Should pass compliance check for eligible user", async function () {
      // Set pool rule bitmap
      // Note: For MVP tests, we'll use a mock PoolId
      // In real deployment, this would be from an actual pool
      const mockPoolId = ethers.id("MOCK_POOL");
      const ruleBitmap = 0b0110n;

      // We can't directly set poolRuleBitmap without a real PoolKey,
      // so we'll test the checkUserCompliance view function instead
      // which simulates the same logic

      // User bitmap: 0b1110 (eligible)
      const userBitmap = 0b1110n;
      const ciphertext = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [userBitmap]
      );
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400);

      await userRegistry.setEncryptedProfileFor(
        await userA.getAddress(),
        ciphertext,
        Number(expiry)
      );

      // Note: checkUserCompliance requires a real PoolId
      // For this test, we'll verify the components work:
      // 1. Registry returns profile correctly
      const [retrievedCiphertext, retrievedExpiry] =
        await userRegistry.getEncryptedProfile(await userA.getAddress());
      expect(retrievedCiphertext).to.equal(ciphertext);
      expect(retrievedExpiry).to.equal(expiry);

      // 2. Verifier returns true for eligible bitmap
      const eligible = await fheVerifier.verify(ciphertext, ruleBitmap);
      expect(eligible).to.be.true;
    });

    it("Should fail compliance check for expired credential", async function () {
      const userBitmap = 0b1110n;
      const ciphertext = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [userBitmap]
      );

      // Set expiry in past
      const expiredExpiry = BigInt(Math.floor(Date.now() / 1000) - 86400);

      await userRegistry.setEncryptedProfileFor(
        await userB.getAddress(),
        ciphertext,
        Number(expiredExpiry)
      );

      // Check if profile is valid (should be false due to expiry)
      const [exists, valid] = await userRegistry.isProfileValid(
        await userB.getAddress()
      );
      expect(exists).to.be.true;
      expect(valid).to.be.false; // Expired
    });

    it("Should fail compliance check for missing credential", async function () {
      // User with no profile should fail
      const [exists, valid] = await userRegistry.isProfileValid(
        await userB.getAddress()
      );
      expect(exists).to.be.false;
      expect(valid).to.be.false;
    });

    it("Should fail compliance check for ineligible bitmap", async function () {
      const ruleBitmap = 0b0110n;
      const userBitmap = 0b0010n; // Missing required bit 2

      const ciphertext = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [userBitmap]
      );
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400);

      await userRegistry.setEncryptedProfileFor(
        await userB.getAddress(),
        ciphertext,
        Number(expiry)
      );

      // Verifier should return false
      const eligible = await fheVerifier.verify(ciphertext, ruleBitmap);
      expect(eligible).to.be.false;
    });
  });

  describe("UserRegistry", function () {
    it("Should set and get encrypted profile", async function () {
      const userBitmap = 0b1110n;
      const ciphertext = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [userBitmap]
      );
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400);

      await userRegistry.setEncryptedProfileFor(
        await userA.getAddress(),
        ciphertext,
        Number(expiry)
      );

      const [retrievedCiphertext, retrievedExpiry] =
        await userRegistry.getEncryptedProfile(await userA.getAddress());

      expect(retrievedCiphertext).to.equal(ciphertext);
      expect(retrievedExpiry).to.equal(expiry);
    });

    it("Should revoke profile", async function () {
      const userBitmap = 0b1110n;
      const ciphertext = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [userBitmap]
      );
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400);

      await userRegistry.setEncryptedProfileFor(
        await userA.getAddress(),
        ciphertext,
        Number(expiry)
      );

      await userRegistry.revokeProfile(await userA.getAddress());

      const [exists, valid] = await userRegistry.isProfileValid(
        await userA.getAddress()
      );
      expect(exists).to.be.true;
      expect(valid).to.be.false; // Revoked
    });
  });
});
