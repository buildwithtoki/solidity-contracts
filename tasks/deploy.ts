/* eslint-disable no-console */
import { task } from "hardhat/config";
import { deployERC20WithAWS, fundAccount, getAWSSecret } from "../lib/deploy";
import type { IAllowList, INativeMinter } from "../typechain-types/contracts/precompiles";
import type { DoubleMinter, TokiERC20 } from "../typechain-types/contracts";
import { parseRoleNumber, parseToki } from "../util";

import { ContractAllowListAddress, NativeMinterAddress } from "./precompiles";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { BigNumber } from "ethers";

async function isAllowedList(contract: IAllowList, address: string) {
  const role = await contract.readAllowList(address);
  const roleName = parseRoleNumber(role);
  return roleName === "enable" || roleName === "admin";
}

type RefillAccounTaskOptions = {
  address: string;
  minimumfunding: string;
};

task(
  "refillAccountNative",
  "Refill account to the minimum funding. Signed by TOKI_DEPLOYER_PRIVATE_KEY",
)
  .addParam("address", "token key")
  .addOptionalParam("minimumfunding", "minimum funding in TOKI", "100000000000000000")
  .setAction(async ({ address, minimumfunding }: RefillAccounTaskOptions, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    if (process.env.TOKI_DEPLOYER_PRIVATE_KEY === undefined)
      throw new Error("Contract Deployer not found. Please set TOKI_DEPLOYER_PRIVATE_KEY");
    const { TOKI_DEPLOYER_PRIVATE_KEY } = process.env;


    console.log(`Refilling account ${ address } to minimum funding of ${ minimumfunding }`);
    await fundAccount({
      provider: ethers.provider,
      accountAddress: address,
      signer: new ethers.Wallet(TOKI_DEPLOYER_PRIVATE_KEY),
      minimumFunding: BigNumber.from(minimumfunding),
    }, hre);

    console.log(`Account ${ address } refilled. Current balance: ${ (await ethers.provider.getBalance(address)).toString() }`);
  });

task(
  "doubleMint",
  "Mint both erc20 tokens and TOKI to a user in one operation.",
)
  .addParam("tokenidentifier", "unique token identifier")
  .addParam("amounterc20", "amount of tokens to mint")
  .addParam("amountnative", "amount of native TOKI to mint")
  .addParam("to", "recipient of tokens with the '0x' prefix")
  .setAction(async ({ tokenidentifier, amounterc20, amountnative, to }:
  {
    tokenidentifier: string;
    amounterc20: string;
    amountnative: string;
    to: string;
  }, hre) => {
    const { ethers } = hre;
    const secret = await getAWSSecret(tokenidentifier);
    const { tokenAddress, doubleMinterRolePrivateKey, doubleMinterAddress } = secret;
    const doubleMinterRole = new ethers.Wallet(doubleMinterRolePrivateKey).connect(ethers.provider);
    const doubleMinterContract = (await ethers.getContractAt("DoubleMinter", doubleMinterAddress)).connect(doubleMinterRole) as DoubleMinter;

    const printBalance = async ({ account, tokenAddress }: { account: string; tokenAddress: string }) => {
      const balanceNative = await ethers.provider.getBalance(account);
      const tokenContract = await ethers.getContractAt("TokiERC20", tokenAddress) as TokiERC20;
      const balanceERC20 = await tokenContract.balanceOf(account);
      const symbol = await tokenContract.symbol();
      console.log(`${ account } has ${ balanceNative.toString() } TOKI and ${ balanceERC20.toString() } ${ symbol }`);
    };

    await printBalance({ account: to, tokenAddress });

    await fundAccount({
      provider: ethers.provider,
      accountAddress: doubleMinterRole.address,
      signer: doubleMinterRole,
      minimumFunding: parseToki("1"),
    }, hre);

    console.log("DoubleMinting tokens...");
    const tx = await doubleMinterContract.mintTokens(to, amountnative, amounterc20, {
      gasLimit: doubleMinterContract.estimateGas.mintTokens(to, amountnative, amounterc20),
      gasPrice: await ethers.provider.getGasPrice(),
    });
    const txReceipt = await tx.wait();
    if (txReceipt.status === 1) {
      console.log("Successfully double minted tokens");
      await printBalance({ account: to, tokenAddress });
    }
    else {
      console.error(`Failed to double mint tokens. Error code: ${ txReceipt.status! }`);
      txReceipt.logs.forEach(log => {
        console.error(log.data);
      });
    }
  });


// the params/flags have to be lowercase alphanumeric, so no word separators.
// it looks to be a bug with the hardhat CLI
task(
  "deployNewToken",
  "Deploys a new token under a new key."
  + "The key is then stored into AWS secrets manager."
  + "\nThis must be run as a contract deployer.",
)
  .addParam("tokenidentifier", "tokenidentifier key. this will be the key of the token's secret in AWS")
  .addParam("name", "formal token name")
  .addParam("symbol", "token ticker, e.g. TOKI")
  .addOptionalParam("decimals", "Number of decimals in the token. Defaults to 18")
  .addFlag("disableaws", "Opt out of uploading to AWS.")
  .addFlag("printprivatekey", "Print private keys to stdout for testing purposes. Only works on the 'local' network")
  .setAction(async ({ tokenidentifier, name, symbol, decimals = 18, disableaws, printprivatekey }:
  {
    tokenidentifier: string;
    name: string;
    symbol: string;
    decimals: number;
    disableaws: boolean;
    printprivatekey: boolean;
  }, hre) => {
    if (process.env.TOKI_DEPLOYER_PRIVATE_KEY === undefined)
      throw new Error("Contract Deployer not found. Please set TOKI_DEPLOYER_PRIVATE_KEY");

    const { TOKI_DEPLOYER_PRIVATE_KEY } = process.env;
    const { ethers } = hre;

    const nativeMinter = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;
    const contractAllowList = await ethers.getContractAt("IAllowList", ContractAllowListAddress) as IAllowList;

    const deployer = new ethers.Wallet(TOKI_DEPLOYER_PRIVATE_KEY)
      .connect(ethers.provider);
    const deployerNativeRole = await nativeMinter.readAllowList(deployer.address);
    const deployerContractRole = await contractAllowList.readAllowList(deployer.address);

    console.log("Deploying all contracts as:");
    console.log(`  Deployer Address:    ${ deployer.address }`);
    console.log(`  NativeMinter   Role: ${ deployerNativeRole.toString() } "${ parseRoleNumber(deployerNativeRole) }"`);
    console.log(`  ContractDeploy Role: ${ deployerContractRole.toString() } "${ parseRoleNumber(deployerContractRole) }"`);
    console.log();

    console.log("Deploying new token...");
    console.log(`  Name:                       ${ name }`);
    console.log(`  Symbol:                     ${ symbol }`);
    const { tokenContract, tokenContractOwner: tokenRole, secretName, doubleMinterAddress, doubleMinterRole }
      = await deployERC20WithAWS(
        {
          identifier: tokenidentifier,
          name,
          symbol,
          decimals,
        },
        {
          deployerPrivateKey: TOKI_DEPLOYER_PRIVATE_KEY,
          uploadToAWS: !disableaws,
        },
        hre,
      );
    console.log(`Deployed the ${ symbol } token! Address: ${ tokenContract.address }`);
    console.log();

    // deploy double minter for this token
    console.log(`Using new DoubleMinter for ${ symbol }...`);
    const doubleMinterContract = await ethers.getContractAt("DoubleMinter", doubleMinterAddress) as DoubleMinter;
    console.log(`  DoubleMinter (${ symbol }): ${ doubleMinterContract.address }`);
    console.log();

    console.log(`Giving the DoubleMinter Role ${ symbol } and TOKI minting access...`);
    const doubleMinterNativeEnabled = await (await nativeMinter.setEnabled(doubleMinterRole.address)).wait();
    const doubleMinterERC20Enabled = await (await tokenContract.setEnabled(doubleMinterRole.address)).wait();
    console.log(`  Native TOKI Minting Enabled: ${ doubleMinterNativeEnabled.status! }`);
    console.log(`  ${ symbol.padStart(11) } Minting Enabled: ${ doubleMinterERC20Enabled.status! }`);
    console.log();

    console.log(`Giving DoubleMinter contract ${ symbol } and TOKI minting access...`);
    const nativeMinterEnabled = await (await nativeMinter.setEnabled(doubleMinterContract.address)).wait();
    const tokenContractEnabled = await (await tokenContract.setEnabled(doubleMinterContract.address)).wait();
    console.log(`  Native TOKI Minting Enabled: ${ nativeMinterEnabled.status! }`);
    console.log(`  ${ symbol.padStart(11) } Minting Enabled: ${ tokenContractEnabled.status! }`);
    console.log();

    // give ownership of double minter to token role
    {
      const oldDoubleMinterOwner = await doubleMinterContract.owner();
      const oldTokenOwner = await tokenContract.owner();

      console.log("Transferring DoubleMinter Contract ownership from deployer to DoubleMinterRole...");
      await (await doubleMinterContract.transferOwnership(doubleMinterRole.address)).wait();

      console.log(`Transferring ${ symbol } ownership from deployer to token role...`);
      await (await tokenContract.transferOwnership(tokenRole.address)).wait();

      const newDoubleMinterOwner = await doubleMinterContract.owner();
      const newTokenOwner = await tokenContract.owner();

      console.log(`  DoubleMinter: New: ${ newDoubleMinterOwner } Old: ${ oldDoubleMinterOwner }`);
      console.log(`  ${ symbol.padEnd(12) }: New: ${ newDoubleMinterOwner } Old: ${ newTokenOwner }`);
      console.log();
    }

    console.log("✅  Deployment complete! Please check AWS for the new secret. 🔑");

    {
      const addressNames: Record<string, string> = {};
      const getAddressName = (addr: string) => addressNames[addr] || "unknown";
      addressNames[deployer.address] = "deployer";
      addressNames[tokenRole.address] = "token";
      addressNames[doubleMinterContract.address] = "doubleMinterContract";
      addressNames[doubleMinterRole.address] = "doubleMinterRole";


      const tokenName = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const supply = (await tokenContract.totalSupply()).toString();
      const tokenOwnerAddress = await tokenContract.owner();
      const doubleMinterOwnerAddress = await doubleMinterContract.owner();
      const tokenNativeEnabled = await isAllowedList(nativeMinter, tokenRole.address);
      console.log("Token Role Key: ");
      console.log(`  Token Role Address:    ${ tokenRole.address } (${ getAddressName(tokenRole.address) })`);
      console.log(`  Token Identifier: ${ tokenidentifier }`);
      console.log(`  Native Minting:      ${ tokenNativeEnabled ? "Enabled" : "Disabled" }`);
      console.log(`  Secret Key:          ${ secretName }`);
      console.log("  PrivateKey:          Stored in AWSSecretsManager ");
      console.log();
      console.log("Newly Deployed Token Contract: ");
      console.log(`  Token Address:       ${ tokenContract.address }`);
      console.log(`  Token Name:          ${ tokenName }`);
      console.log(`  Token Symbol:        ${ symbol }`);
      console.log(`  Token Decimals:      ${ decimals }`);
      console.log(`  Token Supply:        ${ supply }`);
      console.log(`  Token Owner:         ${ tokenOwnerAddress } (${ getAddressName(tokenOwnerAddress) })`);
      console.log();
      console.log("DoubleMinter Contract:");
      console.log(`  Contract Address:    ${ doubleMinterContract.address }`);
      console.log(`  ERC20 Minting:       ${ tokenContractEnabled.status === 1 ? "Enabled" : "Disabled" }`);
      console.log(`  Native Minting:      ${ nativeMinterEnabled.status === 1 ? "Enabled" : "Disabled" }`);
      console.log(`  Owner:               ${ doubleMinterOwnerAddress } (${ getAddressName(doubleMinterOwnerAddress) })`);
      console.log();
      console.log("DoubleMinter Role:");
      console.log(`  Address:             ${ doubleMinterRole.address }`);
      console.log(`  ERC20 Minting:       ${ doubleMinterERC20Enabled.status === 1 ? "Enabled" : "Disabled" }`);
      console.log(`  Native Minting:      ${ doubleMinterNativeEnabled.status === 1 ? "Enabled" : "Disabled" }`);
      console.log("  PrivateKey:          Stored in AWSSecretsManager ");

      if (printprivatekey && hre.network.name === "local") {
        console.warn("--printprivatekey flag enabled. Printing private keys for TEST PURPOSES ONLY.");
        console.log("Private keys:");
        console.log(`  Token Role:     ${ tokenRole.privateKey }`);
        console.log(`  DoubleMinter Role: ${ doubleMinterRole.privateKey }`);
      }
    }
  });
