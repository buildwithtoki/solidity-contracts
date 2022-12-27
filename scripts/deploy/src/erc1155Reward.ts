import dotenv from "dotenv";
import { ethers } from "ethers";
import { LedgerSigner } from "@anders-t/ethers-ledger";

import { parseRoleNumber } from "./utils/parseRoleNumber.js";
import { isAllowedList } from "./utils/isAllowedList.js";
import { deployERC1155ActivityWithAWS } from "./utils/deployTokenWithAWS.js";

import type { IAllowList } from "../../../typechain-types/contracts/precompiles/IAllowList.js";
import IAllowListBinary from "../../../artifacts/contracts/precompiles/IAllowList.sol/IAllowList.json" assert { type: "json" };

import type { INativeMinter } from "../../../typechain-types/contracts/precompiles/INativeMinter.js";
import INativeMinterBinary from "../../../artifacts/contracts/precompiles/INativeMinter.sol/INativeMinter.json" assert { type: "json" };

const CONTRACT_DEPLOYER_CONTRACT_ADDRESS = "0x0200000000000000000000000000000000000000";
const NATIVE_MINTER_CONTRACT_ADDRESS = "0x0200000000000000000000000000000000000001";

dotenv.config();

if (!process.env.AWS_PROFILE) {
  console.error("Please set environment variable: AWS_PROFILE");
  process.exit(1);
}

if (!process.env.TOKEN_IDENTIFIER) {
  console.error("Please set environment variable: TOKEN_IDENTIFIER");
  process.exit(1);
}

const { TOKEN_IDENTIFIER: identifier } = process.env;

const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

const ledger = new LedgerSigner(provider);

const deployer = ethers.Wallet.createRandom().connect(provider);

const contractDeployerLedger = new ethers.Contract(CONTRACT_DEPLOYER_CONTRACT_ADDRESS, IAllowListBinary.abi, ledger) as IAllowList;
const nativeMinterLedger = new ethers.Contract(NATIVE_MINTER_CONTRACT_ADDRESS, INativeMinterBinary.abi, ledger) as INativeMinter;

console.info("Creating deployer:");
console.info(`  Admin Address:       ${ await ledger.getAddress() } `);
console.info(`  Deployer Address:    ${ deployer.address }`);
console.info();

console.info("Enabling deployer to deploy contracts.");
await (await contractDeployerLedger.setEnabled(deployer.address)).wait();
console.info("Setting deployer as admin for native token.");
await (await nativeMinterLedger.setAdmin(deployer.address)).wait();
console.info("Minting 1 TOKI to deployer");
await (await nativeMinterLedger.mintNativeCoin(deployer.address, ethers.utils.parseUnits("1", 18))).wait();
console.info();

let deployerContractRole = await contractDeployerLedger.readAllowList(deployer.address);
let deployerNativeRole = await nativeMinterLedger.readAllowList(deployer.address);

try {
  console.info("Deploying all contracts as:");
  console.info(`  Deployer Address:    ${ deployer.address }`);
  console.info(`  ContractDeploy Role: ${ deployerContractRole.toString() } "${ parseRoleNumber(deployerContractRole) }"`);
  console.info(`  NativeMinter   Role: ${ deployerNativeRole.toString() } "${ parseRoleNumber(deployerNativeRole) }"`);
  console.info();

  const nativeMinter = new ethers.Contract(NATIVE_MINTER_CONTRACT_ADDRESS, INativeMinterBinary.abi, deployer) as INativeMinter;

  console.info("Deploying new ERC1155 Activity Rewards contract...");
  const { tokenContract, tokenContractOwner: tokenRole, secretName }
  = await deployERC1155ActivityWithAWS(
    {
      identifier,
    },
    {
      deployer,
      uploadToAWS: true,
    },
  );
  console.info(`Deployed! Address: ${ tokenContract.address }`);
  console.info();

  console.info("✅  Deployment complete! Please check AWS for the new secret. 🔑");

  {
    const addressNames: Record<string, string> = {};
    const getAddressName = (addr: string) => addressNames[addr] || "unknown";
    addressNames[deployer.address] = "deployer";
    addressNames[tokenRole.address] = "token";


    const tokenOwnerAddress = await tokenContract.owner();
    const tokenNativeEnabled = await isAllowedList(nativeMinter, tokenRole.address);
    console.info("Token Role Key: ");
    console.info(`  Token Role Address:    ${ tokenRole.address } (${ getAddressName(tokenRole.address) })`);
    console.info(`  Token Identifier:    ${ identifier }`);
    console.info(`  Native Minting:      ${ tokenNativeEnabled ? "Enabled" : "Disabled" }`);
    console.info(`  Secret Key:          ${ secretName }`);
    console.info("  PrivateKey:          Stored in AWSSecretsManager ");
    console.info();
    console.info("Newly Deployed Token Contract: ");
    console.info(`  Token Address:       ${ tokenContract.address }`);
    console.info(`  Token Owner:         ${ tokenOwnerAddress } (${ getAddressName(tokenOwnerAddress) })`);
    console.info();
  }
}
finally {
  console.info("Revoking deployer permissions:");
  console.info("Revoking native minter permissions.");
  await (await nativeMinterLedger.setNone(deployer.address)).wait();
  console.info("Revoking contract deploy permissions.");
  await (await contractDeployerLedger.setNone(deployer.address)).wait();

  deployerContractRole = await contractDeployerLedger.readAllowList(deployer.address);
  deployerNativeRole = await nativeMinterLedger.readAllowList(deployer.address);

  console.info(`  Deployer Address:    ${ deployer.address }`);
  console.info(`  ContractDeploy Role: ${ deployerContractRole.toString() } "${ parseRoleNumber(deployerContractRole) }"`);
  console.info(`  NativeMinter   Role: ${ deployerNativeRole.toString() } "${ parseRoleNumber(deployerNativeRole) }"`);
  console.info();
}
