/* eslint-disable no-console */
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import fs from "fs";
import type { Wallet, BigNumber } from "ethers";
import type { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

export function parseToki(value: string) {
  return ethers.utils.parseUnits(value, 18);
}

export function toToki(value: string, decimals = 18) {
  return ethers.utils.formatUnits(value, decimals);
}

export function parseEther(val: string, decimals = 18) {
  return ethers.utils.parseUnits(val, decimals);
}

export type SendTx = {
  toAddress: string;
  fromAddress: string;
  signer: SignerWithAddress;
  amount: string;
};

/**
 * @param {SendTx} tx
 * @returns {Promise<string>}
 */
export async function sendNativeToken(tx: SendTx, ethersRuntime: typeof ethers & HardhatEthersHelpers): Promise<ethers.providers.TransactionReceipt> {
  const nonce = await ethersRuntime.provider.getTransactionCount(tx.fromAddress, "latest");
  const response = await tx.signer.sendTransaction({
    to: tx.toAddress,
    from: tx.fromAddress,
    value: parseToki(tx.amount),
    nonce,
    gasLimit: ethers.utils.hexlify(100000),
    gasPrice: await ethersRuntime.provider.getGasPrice(),
  });
  return response.wait();
}

export function parseRoleNumber(roleNumber: number | BigNumber) {
  const n: number = typeof roleNumber === "number" ? roleNumber : roleNumber.toNumber();

  switch (n) {
    case 0:
      return "none";

    case 1:
      return "enable";

    case 2:
      return "admin";

    default:
      return "unknown";
  }
}

export function parseRole(role: string) {
  switch (role) {
    case "none":
      return 0;

    case "enable":
      return 1;

    case "admin":
      return 2;

    default:
      throw Error(`Unknown role "${ role }"`);
  }
}

export function printToFile(content: string, filename: string) {
  fs.writeFileSync(filename, content);
  console.log(`${ filename } was saved!`);
}

/**
 * Generates numWallets number of wallets and returns
 * an array of private keys. These private keys can
 * be used in the tests to sign transactions.
 */
export function generateWallets(numWallets: number, hre: HardhatRuntimeEnvironment) {
  const wallets = [];
  for (let i = 0; i < numWallets; i++) {
    const wallet = hre.ethers.Wallet.createRandom();
    wallets.push(wallet);
  }
  return wallets;
}


export function walletsToString(wallets: Wallet[]): string {
  const walletsWithMnemonic = wallets.map(wallet => ({
    ...wallet,
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
  }));
  return JSON.stringify(walletsWithMnemonic);
}
