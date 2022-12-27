/* eslint-disable no-console */
import { task } from "hardhat/config";
import type { TokiERC20 } from "../typechain-types/contracts";
import fs from "fs";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { BigNumber } from "ethers";

task(
  "printBalances",
  "Print balances of given wallet",
)
  .addParam("wallet", "user's wallet address")
  .addOptionalVariadicPositionalParam("tokenAddresses", "token contract address e.g. 0x...", [])
  .setAction(async ({ tokenAddresses, wallet }: { tokenAddresses: string[]; wallet: string }, hre) => {
    await hre.run("printNativeBalance", { wallet });

    // print balance of each address
    for (const contractAddress of tokenAddresses)
      await hre.run("printTokenBalance", { contractAddress, wallet });
  });

task(
  "printNativeBalance",
  "Print a wallet's TOKI balance",
)
  .addParam("wallet", "user's wallet address")
  .setAction(async ({ wallet }, hre) => {
    const tokiBalance = await hre.ethers.provider.getBalance(wallet);
    const tokiBalanceReadable = hre.ethers.utils.formatEther(tokiBalance);
    console.log(`${ wallet }'s TOKI balance: ${ tokiBalanceReadable }`);
  });

task(
  "printTokenBalance",
  "Print a user's balance for a given token",
)
  .addParam("wallet", "user's wallet address")
  .addParam("contractAddress", "token's contract owner")
  .setAction(async ({ wallet, contractAddress }, hre) => {
    const contract = await hre.ethers
      .getContractAt("TokiERC20", contractAddress) as TokiERC20;
    const balance = await contract.balanceOf(wallet);
    const name = contract["name"];
    console.log(`${ name } balance: ${ balance }`);
  });


task(
  "printERC20Contract",
  "Prints the parameters of a given ERC20 contract",
)
  .addParam("address", "Address of the deployed ERC20 contract")
  .setAction(async ({ address }, hre) => {
    const token = await hre.ethers.getContractAt("TokiERC20", address);
    // TODO put this in print funcion
    console.log(`Name: ${ await token.name() }`);
    console.log(`Symbol: ${ await token.symbol() }`);
    console.log(`Minted Amount: ${ await token.totalSupply() }`);
  });


task(
  "listTokens",
  "Lists all deployed tokens on Toki",
)
  .setAction(async (args, hre) => {
    hre.ethers.getContractAt("TokiERC20", "0x610bdD1Bbc008b25614Ac490e8Cb4ac3df60f8fc");
    console.log(args);
  });


task(
  "listBalancesFromFile",
  "Print balance of each address in a file",
)
  .addParam("json", "JSON file containing addresses, generated from generate_wallets.js")
  .addOptionalVariadicPositionalParam("tokenAddresses", "token contract address e.g. 0x...", [])
  .setAction(async ({ json, tokenAddresses }, hre) => {
    const file = fs.readFileSync(json, "utf8");
    const wallets: [{ address: string }] = JSON.parse(file);


    for (const wallet of wallets)
      await hre.run("printBalances", { wallet: wallet.address, tokenAddresses });
  });

task("accounts", "Prints the list of accounts", async (args, hre): Promise<void> => {
  const accounts: SignerWithAddress[] = await hre.ethers.getSigners();
  accounts.forEach((account: SignerWithAddress): void => {
    console.log(account.address);
  });
});

task("balances", "Prints the list of AVAX account balances", async (args, hre): Promise<void> => {
  const accounts: SignerWithAddress[] = await hre.ethers.getSigners();
  for (const account of accounts) {
    const balance: BigNumber = await hre.ethers.provider.getBalance(account.address);
    console.log(`${ account.address } has balance ${ balance.toString() }`);
  }
});
