/* eslint-disable no-console */
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import * as hre from "hardhat";
import { fundAccount } from "../lib/deploy";
import type { TokiERC20 } from "../typechain-types/contracts";
const { ethers } = hre;
import { parseEther } from "../util";
import { promisify } from "util";
const sleep = promisify(setTimeout);

export type SendTx = {
  toAddress: string;
  fromAddress: string;
  amount: string;
  signer: SignerWithAddress;
};

describe("TokiERC20", () => {
  let deployer: SignerWithAddress,
    account1: SignerWithAddress,
    account2: SignerWithAddress,
    account3: SignerWithAddress,
    account4: SignerWithAddress;
  let token: TokiERC20;

  async function setup() {
    const accounts = await ethers.getSigners();
    [ deployer, account1, account2, account3, account4 ] = accounts;

    // make sure each account has at least 5 native coin to do transactions
    const transactions = [];
    for (const { address } of accounts) {
      transactions.push(fundAccount({ provider: ethers.provider,
        signer: deployer,
        accountAddress: address,
        minimumFunding: parseEther("5") }, hre));

      await sleep(100); // Prevent transactions from being rejected due to running to quickly
    }

    const tokiERC20Factory = await ethers.getContractFactory("TokiERC20", deployer);

    token = await tokiERC20Factory.deploy(
      "ERC20 Token",
      "ERC20",
    ) as TokiERC20;
  }

  describe("Proper Token Deployment", () => {
    before(setup);

    it("Check Token Name", async () => {
      const name = await token.name();
      expect(name).to.deep.equal("ERC20 Token");
    });

    it("Check Token Symbol", async () => {
      const symbol = await token.symbol();
      expect(symbol).to.deep.equal("ERC20");
    });

    it("Check Token Contract owner", async () => {
      const owner = await token.owner();
      expect(owner).to.deep.equal(deployer.address);
    });
  });

  describe("Functionality", () => {
    beforeEach(setup);

    it("an authorized wallet can mint tokens", async () => {
      const beforeBalance = await token.balanceOf(account1.address);

      const tx = await token.connect(deployer).mintToken(
        account1.address,
        parseEther("100"),
      );
      await tx.wait();
      const newBalance = await token.balanceOf(account1.address);
      expect(newBalance).to.equal(beforeBalance.add(parseEther("100")));
    });

    it("an unauthorized wallet fails to mint tokens", async () => {
      assert.notEqual(await token.owner(), account3.address);
      expect(await token.readAllowList(account3.address)).to.equal(0);
      await expect((async () => {
        const tx = await token.connect(account3).mintToken(
          account3.address,
          parseEther("100"),
        );
        await tx.wait();
      })()).to.be.rejected;
    });

    it("contract owner can transfer ownership to a different address", async () => {
      await (await token.connect(deployer).transferOwnership(deployer.address)).wait();
      await (await token.connect(deployer).transferOwnership(account2.address)).wait();
      const curOwner = await token.owner();
      expect(curOwner).to.be.not.equal(deployer.address);
      expect(curOwner).to.be.equal(account2.address);
    });

    it("a newly allowed minter can mint tokens", async () => {
      let tx = await token.connect(deployer).setEnabled(account1.address);
      await tx.wait();
      expect(await token.readAllowList(account1.address)).to.equal(1);

      tx = await token.connect(account1).mintToken(
        account4.address,
        parseEther("100"),
      );
      await tx.wait();
      expect(await token.balanceOf(account4.address)).to.equal(parseEther("100"));
    });

    it("a newly revoked minter fails to mint tokens", async () => {
      const tx = await token.connect(deployer).setEnabled(account1.address);
      await tx.wait();
      expect(await token.readAllowList(account1.address)).to.equal(1);

      const tx2 = await token.connect(deployer).setNone(account1.address);
      await tx2.wait();
      expect(await token.readAllowList(account1.address)).to.equal(0);

      await expect((async () => {
        const tx3 = await token.connect(account1).mintToken(
          account4.address,
          parseEther("100"),
        );
        await tx3.wait();
      })()).to.be.rejected;
    });
  });
});
