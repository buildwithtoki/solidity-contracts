/* eslint-disable no-console */
import "@nomicfoundation/hardhat-chai-matchers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import * as hre from "hardhat";
import { ethers } from "hardhat";
import { fundAccount } from "../lib/deploy";
import { NativeMinterAddress } from "../tasks/precompiles";
import type { ERC1155ActivitiesDoubleMinter, RewardERC1155 } from "../typechain-types/contracts";
import type { INativeMinter } from "../typechain-types/contracts/precompiles";
import { parseRoleNumber, parseToki } from "../util";
import { promisify } from "util";

const sleep = promisify(setTimeout);

export type SendTx = {
  toAddress: string;
  fromAddress: string;
  amount: string;
  signer: SignerWithAddress;
};

/**
 * Return all accounts initialized with at least 5 tokens each.
 */
async function initializeAccounts() {
  const accounts = await ethers.getSigners();
  const [
    admin,
  ] = accounts;

  // make sure each account has at least 5 native coin to do transactions
  console.log("Checking accounts...");
  const transactions = [];
  for (const account of accounts) {
    transactions.push(fundAccount({ signer: admin,
      provider: ethers.provider,
      accountAddress: account.address,
      minimumFunding: BigNumber.from(parseToki("5")) }, hre));
    await sleep(100); // Prevent transactions from being rejected due to running to quickly
  }
  await Promise.all(transactions);

  return accounts;
}

async function initializeERC1155Token(admin: SignerWithAddress) {
  const tokenFactory = await ethers.getContractFactory("RewardERC1155", admin);
  return tokenFactory.deploy();
}

if (hre.network.name !== "hardhat") {
  describe("ERC1155ActivitiesDoubleMinter", () => {
    let admin: SignerWithAddress,
      deployer: SignerWithAddress,
      normalUser: SignerWithAddress;

    let nativeToken: INativeMinter;
    let erc1155Token: RewardERC1155;

    before(async () => {
      [
        admin,
        deployer,
        normalUser,
      ] = await initializeAccounts();
      nativeToken = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;
      erc1155Token = await initializeERC1155Token(admin) as RewardERC1155;
      await erc1155Token.connect(admin).createCollection(
        deployer.address,
        "uri1",
        1000
      )
    });


    it("can atomically drop ERC1155 and native tokens in one transaction", async () => {
      const nativeMinterContract = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;

      const beforeNative = await ethers.provider.getBalance(normalUser.address);
      const beforeERC1155 = await erc1155Token.balanceOf(normalUser.address, 0);

      const erc1155DoubleMinterFactory = await ethers.getContractFactory("ERC1155ActivitiesDoubleMinter", admin);
      const erc1155DoubleMinter = await erc1155DoubleMinterFactory.deploy(erc1155Token.address, 0) as ERC1155ActivitiesDoubleMinter;

      {
        console.log("Checking admin permissions for native minter...");
        const role = await nativeMinterContract.readAllowList(admin.address);
        console.log(`Admin role: ${ parseRoleNumber(role) }`);
      }


      {
        console.log(`Checking admin permissions for ERC1155...`);
        const role = await erc1155Token.readAllowList(admin.address, 0);
        console.log(`Admin role: ${ parseRoleNumber(role) }`);
      }

      const transactions = [];

      console.log("Enabling ERC1155ActivitiesDoubleMinter for Toki native coin");
      transactions.push(await nativeMinterContract.connect(admin).setEnabled(erc1155DoubleMinter.address));

      console.log(`Enabling ERC1155ActivitiesDoubleMinter on ERC1155...`);
      transactions.push(await erc1155Token.connect(admin).setEnabled(erc1155DoubleMinter.address, 0));

      console.log("Enabling deployer to mint Toki native coin");
      transactions.push(await nativeMinterContract.connect(admin).setEnabled(deployer.address));

      console.log(`Enabling deployer to mint ERC1155...`);
      transactions.push(await erc1155Token.connect(admin).setEnabled(deployer.address, 0));

      const results = await Promise.all(transactions);
      await Promise.all(results.map(async result => result.wait()));

      console.log(`Checking native TOKI mint permissions for deployer ${ deployer.address }...`);
      {
        const doubleRole = await nativeMinterContract.readAllowList(erc1155DoubleMinter.address);
        const deployerRole = await nativeMinterContract.readAllowList(deployer.address);
        expect(deployerRole).to.be.equal(BigNumber.from(1));
        expect(doubleRole).to.be.equal(BigNumber.from(1));
      }
      console.log(`Checking ERC1155 mint permissions for deployer ${ deployer.address }...`);
      {
        const doubleRole = await erc1155Token.readAllowList(erc1155DoubleMinter.address, 0);
        const deployerRole = await erc1155Token.readAllowList(deployer.address, 0);
        expect(deployerRole).to.be.equal(BigNumber.from(1));
        expect(doubleRole).to.be.equal(BigNumber.from(1));
      }

      console.log(`Dropping both tokens at once to normalUser ${ normalUser.address }...`);
      const tx = await erc1155DoubleMinter.connect(deployer).mintTokens(
        normalUser.address,
        parseToki("7"), // native tokens
        8, // ERC1155 tokens
      );
      const receipt = await tx.wait();

      const afterNative = await ethers.provider.getBalance(normalUser.address);
      const afterERC1155 = await erc1155Token.balanceOf(normalUser.address, 0);

      expect(beforeERC1155).to.be.not.equal(afterERC1155);
      expect(afterERC1155).to.be.equal(beforeERC1155.add(8));

      expect(receipt.status).to.be.equal(1);
      expect(beforeNative).to.be.not.equal(afterNative);
      expect(afterNative).to.be.equal(beforeNative.add(parseEther("7")));
    });

    //                   ERC1155  Native
    // ERC1155ActivitiesDoubleMinterRole:   1       1
    // ERC1155ActivitiesDoubleMinter:       1       1
    // Token Owner:        1       0
    describe("can mint native token as a proxy for token key", () => {
      let erc1155DoubleMinter: ERC1155ActivitiesDoubleMinter;
      let tokenOwner: SignerWithAddress;
      let erc1155DoubleMinterRole: SignerWithAddress;

      before(async () => {
        [
          admin,
          tokenOwner,
          normalUser,
          erc1155DoubleMinterRole,
        ] = await initializeAccounts();
        nativeToken = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;
        erc1155Token = await initializeERC1155Token(admin) as RewardERC1155;
        await erc1155Token.connect(admin).createCollection(
          deployer.address,
          "uri1",
          1000
        )

        const erc1155DoubleMinterFactory = await ethers.getContractFactory("ERC1155ActivitiesDoubleMinter", admin);
        erc1155DoubleMinter = await erc1155DoubleMinterFactory.deploy(erc1155Token.address, 0) as ERC1155ActivitiesDoubleMinter;

        console.log("Setting permissions...");
        const transactions = [];

        transactions.push(await erc1155Token.setEnabled(erc1155DoubleMinter.address, 0));
        transactions.push(await nativeToken.setEnabled(erc1155DoubleMinter.address));

        transactions.push(await erc1155Token.setEnabled(tokenOwner.address, 0));
        transactions.push(await nativeToken.setNone(tokenOwner.address));

        transactions.push(await nativeToken.setEnabled(erc1155DoubleMinterRole.address));
        transactions.push(await erc1155Token.setEnabled(erc1155DoubleMinterRole.address, 0));

        transactions.push(await erc1155DoubleMinter.transferOwnership(erc1155DoubleMinterRole.address));
        transactions.push(await erc1155Token.transferOwnership(tokenOwner.address));

        const txs = await Promise.all(transactions);
        await Promise.all(txs.map(async tx => tx.wait()));
      });


      it("Token owner is admin for token", async () => {
        const role = await erc1155Token.readAllowList(tokenOwner.address, 0);
        expect(role).to.be.equal(BigNumber.from(2));
      });

      it("Token disabled for native", async () => {
        const role = await nativeToken.readAllowList(tokenOwner.address);
        expect(role).to.be.equal(BigNumber.from(0));
      });

      it("ERC1155ActivitiesDoubleMinterRole owns ERC1155ActivitiesDoubleMinter", async () => {
        const owner = await erc1155DoubleMinter.owner();
        expect(owner).to.equal(erc1155DoubleMinterRole.address);
      });

      it("ERC1155ActivitiesDoubleMinter Contract enabled for ERC1155", async () => {
        const role = await erc1155Token.readAllowList(erc1155DoubleMinter.address, 0);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("ERC1155ActivitiesDoubleMinter Contract enabled for native", async () => {
        const role = await nativeToken.readAllowList(erc1155DoubleMinter.address);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("ERC1155ActivitiesDoubleMinter Role enabled for ERC1155", async () => {
        const role = await erc1155Token.readAllowList(erc1155DoubleMinterRole.address, 0);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("ERC1155ActivitiesDoubleMinter Role enabled for native", async () => {
        const role = await nativeToken.readAllowList(erc1155DoubleMinterRole.address);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("Token owner owns ERC1155 token contract", async () => {
        const owner = await erc1155Token.owner();
        expect(owner).to.be.equal(tokenOwner.address);
      });

      describe("Token owner can NOT mint native tokens via", () => {
        it("fails calling ERC1155ActivitiesDoubleMinter contract mintTokens()", async () => {
          await expect((async () => {
            const tx = await erc1155DoubleMinter.connect(tokenOwner).mintTokens(
              normalUser.address,
              parseEther("4444"),
              44,
            );
            await tx.wait();
          })()).to.be.rejected;
        });

        it("fails calling NativeMinter precompiled contract", async () => {
          await expect((async () => {
            const tx = await nativeToken.connect(tokenOwner).mintNativeCoin(
              normalUser.address,
              parseToki("44"),
            );
            await tx.wait();
          })()).to.be.rejected;
        });
      });

      it("ERC1155ActivitiesDoubleMinterRole can drop tokens with ERC1155ActivitiesDoubleMinter Contract", async () => {
        const beforeBalance = {
          native: await ethers.provider.getBalance(normalUser.address),
          erc1155: await erc1155Token.balanceOf(normalUser.address, 0),
        };

        await (await erc1155DoubleMinter.connect(erc1155DoubleMinterRole).mintTokens(
          normalUser.address,
          parseEther("4444"),
          44,
        )).wait();

        const afterBalance = {
          native: await ethers.provider.getBalance(normalUser.address),
          erc1155: await erc1155Token.balanceOf(normalUser.address, 0),
        };

        void expect(afterBalance.native.gt(beforeBalance.native)).to.be.true;
        void expect(afterBalance.erc1155.gt(beforeBalance.erc1155)).to.be.true;
      });
    });
  });
}
