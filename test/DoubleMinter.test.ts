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
import type { DoubleMinter, TokiERC20 } from "../typechain-types/contracts";
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

async function initializeERC20Token(admin: SignerWithAddress) {
  const tokenFactory = await ethers.getContractFactory("TokiERC20", admin);
  return tokenFactory.deploy("ERC20 Token", "ERC20");
}

if (hre.network.name !== "hardhat") {
  describe("DoubleMinter", () => {
    let admin: SignerWithAddress,
      deployer: SignerWithAddress,
      normalUser: SignerWithAddress;

    let nativeToken: INativeMinter;
    let erc20Token: TokiERC20;

    before(async () => {
      [
        admin,
        deployer,
        normalUser,
      ] = await initializeAccounts();
      nativeToken = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;
      erc20Token = await initializeERC20Token(admin) as TokiERC20;
    });


    it("can atomically drop ERC20 and native tokens in one transaction", async () => {
      const tokenName = await erc20Token.symbol();
      const nativeMinterContract = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;

      const beforeNative = await ethers.provider.getBalance(normalUser.address);
      const beforeERC20 = await erc20Token.balanceOf(normalUser.address);

      const doubleMinterFactory = await ethers.getContractFactory("DoubleMinter", admin);
      const doubleMinter = await doubleMinterFactory.deploy(erc20Token.address) as DoubleMinter;

      {
        console.log("Checking admin permissions for native minter...");
        const role = await nativeMinterContract.readAllowList(admin.address);
        console.log(`Admin role: ${ parseRoleNumber(role) }`);
      }

      {
        console.log(`Checking admin permissions for ${ tokenName }...`);
        const role = await erc20Token.readAllowList(admin.address);
        console.log(`Admin role: ${ parseRoleNumber(role) }`);
      }

      const transactions = [];

      console.log("Enabling DoubleMinter for Toki native coin");
      transactions.push(await nativeMinterContract.connect(admin).setEnabled(doubleMinter.address));

      console.log(`Enabling DoubleMinter on ${ tokenName }...`);
      transactions.push(await erc20Token.connect(admin).setEnabled(doubleMinter.address));

      console.log("Enabling deployer to mint Toki native coin");
      transactions.push(await nativeMinterContract.connect(admin).setEnabled(deployer.address));

      console.log(`Enabling deployer to mint ${ tokenName }...`);
      transactions.push(await erc20Token.connect(admin).setEnabled(deployer.address));

      const results = await Promise.all(transactions);
      await Promise.all(results.map(async result => result.wait()));

      console.log(`Checking native TOKI mint permissions for deployer ${ deployer.address }...`);
      {
        const doubleRole = await nativeMinterContract.readAllowList(doubleMinter.address);
        const deployerRole = await nativeMinterContract.readAllowList(deployer.address);
        expect(deployerRole).to.be.equal(BigNumber.from(1));
        expect(doubleRole).to.be.equal(BigNumber.from(1));
      }
      console.log(`Checking ${ tokenName } mint permissions for deployer ${ deployer.address }...`);
      {
        const doubleRole = await erc20Token.readAllowList(doubleMinter.address);
        const deployerRole = await erc20Token.readAllowList(deployer.address);
        expect(deployerRole).to.be.equal(BigNumber.from(1));
        expect(doubleRole).to.be.equal(BigNumber.from(1));
      }

      console.log(`Dropping both tokens at once to normalUser ${ normalUser.address }...`);
      const tx = await doubleMinter.connect(deployer).mintTokens(
        normalUser.address,
        parseToki("7"), // native tokens
        parseEther("8"), // ERC20 tokens
      );
      const receipt = await tx.wait();

      const afterNative = await ethers.provider.getBalance(normalUser.address);
      const afterERC20 = await erc20Token.balanceOf(normalUser.address);

      expect(beforeERC20).to.be.not.equal(afterERC20);
      expect(afterERC20).to.be.equal(beforeERC20.add(parseEther("8")));

      expect(receipt.status).to.be.equal(1);
      expect(beforeNative).to.be.not.equal(afterNative);
      expect(afterNative).to.be.equal(beforeNative.add(parseEther("7")));
    });

    //                   ERC20  Native
    // DoubleMinterRole:   1       1
    // DoubleMinter:       1       1
    // Token Owner:        1       0
    describe("can mint native token as a proxy for token key", () => {
      let doubleMinter: DoubleMinter;
      let tokenOwner: SignerWithAddress;
      let doubleMinterRole: SignerWithAddress;

      before(async () => {
        [
          admin,
          tokenOwner,
          normalUser,
          doubleMinterRole,
        ] = await initializeAccounts();
        nativeToken = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;
        erc20Token = await initializeERC20Token(admin) as TokiERC20;

        const doubleMinterFactory = await ethers.getContractFactory("DoubleMinter", admin);
        doubleMinter = await doubleMinterFactory.deploy(erc20Token.address) as DoubleMinter;

        console.log("Setting permissions...");
        const transactions = [];

        transactions.push(await erc20Token.setEnabled(doubleMinter.address));
        transactions.push(await nativeToken.setEnabled(doubleMinter.address));

        transactions.push(await erc20Token.setEnabled(tokenOwner.address));
        transactions.push(await nativeToken.setNone(tokenOwner.address));

        transactions.push(await nativeToken.setEnabled(doubleMinterRole.address));
        transactions.push(await erc20Token.setEnabled(doubleMinterRole.address));

        transactions.push(await doubleMinter.transferOwnership(doubleMinterRole.address));
        transactions.push(await erc20Token.transferOwnership(tokenOwner.address));

        const txs = await Promise.all(transactions);
        await Promise.all(txs.map(async tx => tx.wait()));
      });


      it("Token owner is admin for token", async () => {
        const role = await erc20Token.readAllowList(tokenOwner.address);
        expect(role).to.be.equal(BigNumber.from(2));
      });

      it("Token disabled for native", async () => {
        const role = await nativeToken.readAllowList(tokenOwner.address);
        expect(role).to.be.equal(BigNumber.from(0));
      });

      it("DoubleMinterRole owns DoubleMinter", async () => {
        const owner = await doubleMinter.owner();
        expect(owner).to.equal(doubleMinterRole.address);
      });

      it("DoubleMinter Contract enabled for ERC20", async () => {
        const role = await erc20Token.readAllowList(doubleMinter.address);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("DoubleMinter Contract enabled for native", async () => {
        const role = await nativeToken.readAllowList(doubleMinter.address);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("DoubleMinter Role enabled for ERC20", async () => {
        const role = await erc20Token.readAllowList(doubleMinterRole.address);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("DoubleMinter Role enabled for native", async () => {
        const role = await nativeToken.readAllowList(doubleMinterRole.address);
        expect(role).to.be.equal(BigNumber.from(1));
      });

      it("Token owner owns ERC20 token contract", async () => {
        const owner = await erc20Token.owner();
        expect(owner).to.be.equal(tokenOwner.address);
      });

      describe("Token owner can NOT mint native tokens via", () => {
        it("fails calling DoubleMinter contract mintTokens()", async () => {
          await expect((async () => {
            const tx = await doubleMinter.connect(tokenOwner).mintTokens(
              normalUser.address,
              parseEther("4444"),
              parseToki("44"),
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

      it("DoubleMinterRole can drop tokens with DoubleMinter Contract", async () => {
        const beforeBalance = {
          native: await ethers.provider.getBalance(normalUser.address),
          erc20: await erc20Token.balanceOf(normalUser.address),
        };

        await (await doubleMinter.connect(doubleMinterRole).mintTokens(
          normalUser.address,
          parseEther("4444"),
          parseToki("44"),
        )).wait();

        const afterBalance = {
          native: await ethers.provider.getBalance(normalUser.address),
          erc20: await erc20Token.balanceOf(normalUser.address),
        };

        void expect(afterBalance.native.gt(beforeBalance.native)).to.be.true;
        void expect(afterBalance.erc20.gt(beforeBalance.erc20)).to.be.true;
      });
    });
  });
}
