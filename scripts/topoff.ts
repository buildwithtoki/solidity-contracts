/* eslint-disable no-console */
import dotenv from "dotenv";
import { BigNumber } from "ethers";
import * as hre from "hardhat";
import { fundAccount, getAWSSecret } from "../lib/deploy";
import { parseEther } from "../util";

dotenv.config();

/**
 * Funds the account with enough native Toki to keep minting.
 */
export async function topOffAccount(merchantName: string, minimumFunding: BigNumber) {
  const {
    TOKI_DEPLOYER_PRIVATE_KEY,
    TOKI_NODE_JSONRPC_URL,
    TOKI_TX_GAS_PRICE,
    TOKI_TX_GAS_LIMIT,
  } = process.env;
  if (!TOKI_DEPLOYER_PRIVATE_KEY)
    throw Error("TOKI_DEPLOYER_PRIVATE_KEY not set");
  if (!TOKI_NODE_JSONRPC_URL)
    throw Error("TOKI_NODE_JSONRPC_URL not set");
  if (!TOKI_TX_GAS_LIMIT)
    throw Error("TOKI_TX_GAS_LIMIT not set. Set this using the setting from the genesis file.");
  if (!TOKI_TX_GAS_PRICE)
    throw Error("TOKI_TX_GAS_PRICE not set. Set this using the setting from the genesis file.");

  const gasLimit = BigNumber.from(TOKI_TX_GAS_LIMIT);
  const gasPrice = BigNumber.from(TOKI_TX_GAS_PRICE);

  const {
    doubleMinterRoleAddress,
    merchantAddress,
    tokenInfo,
  } = await getAWSSecret(merchantName);
  const { symbol } = tokenInfo;
  const { ethers } = hre;

  const provider = new ethers.providers.JsonRpcProvider({
    url: TOKI_NODE_JSONRPC_URL,
  });
  const signer = new ethers.Wallet(`0x${ TOKI_DEPLOYER_PRIVATE_KEY }`, provider);

  const signerBalance = await signer.getBalance();
  console.log(`hre network: ${ hre.network.name }`);
  console.log(`Signer has ${ signerBalance } TOKI`);

  console.log(`Funding ${ merchantName } up to ${ minimumFunding } TOKI`);
  await fundAccount({
    signer,
    provider,
    accountAddress: merchantAddress,
    minimumFunding,
    gasLimit,
    gasPrice,
  }, hre);

  console.log(`Funding ${ symbol }'s DoubleMinterRole up to ${ minimumFunding } TOKI`);
  await fundAccount({
    signer,
    provider,
    accountAddress: doubleMinterRoleAddress,
    minimumFunding,
    gasLimit,
    gasPrice,
  }, hre);

  const merchantBalance = await provider.getBalance(merchantAddress);
  const doubleMinterBalance = await provider.getBalance(doubleMinterRoleAddress);
  console.log("TOKI Balances:");
  console.log(`  - Merchant '${ merchantName }':`, merchantBalance.toString());
  console.log(`  - DoubleMinter '${ symbol }':`, doubleMinterBalance.toString());
}

type MainInput = {
  merchantName: string;
  minimumFunding: BigNumber;
};

async function main({ merchantName, minimumFunding }: MainInput) {
  await hre.run("compile");
  return topOffAccount(merchantName, minimumFunding);
}

main({
  merchantName: "mytest",
  minimumFunding: parseEther("100"),
}).then(() => {
  console.log("Top-off complete");
})
  .catch(console.error);
