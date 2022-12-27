import dotenv from "dotenv";
import { ethers } from "ethers";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { parseRoleNumber } from "./utils/parseRoleNumber.js";
import { isAllowedList } from "./utils/isAllowedList.js";
import { deployERC1155ActivityDoubleMinterWithAWS } from "./utils/deployTokenWithAWS.js";
import IAllowListBinary from "../../../artifacts/contracts/precompiles/IAllowList.sol/IAllowList.json" assert { type: "json" };
import INativeMinterBinary from "../../../artifacts/contracts/precompiles/INativeMinter.sol/INativeMinter.json" assert { type: "json" };
import ERC1155ActivitiesDoubleMinterBinary from "../../../artifacts/contracts/ERC1155ActivitiesDoubleMinter.sol/ERC1155ActivitiesDoubleMinter.json" assert { type: "json" };
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
if (!process.env.TOKEN_ADDRESS) {
    console.error("Please set environment variable: TOKEN_ADDRESS");
    process.exit(1);
}
if (!process.env.TOKEN_URI) {
    console.error("Please set environment variable: TOKEN_URI");
    process.exit(1);
}
const { TOKEN_IDENTIFIER: identifier, TOKEN_ADDRESS: tokenAddress, TOKEN_URI: uri, TOKEN_MAX_TOTAL_SUPPLY: maxTotalSupply } = process.env;
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const ledger = new LedgerSigner(provider);
const deployer = ethers.Wallet.createRandom().connect(provider);
const contractDeployerLedger = new ethers.Contract(CONTRACT_DEPLOYER_CONTRACT_ADDRESS, IAllowListBinary.abi, ledger);
const nativeMinterLedger = new ethers.Contract(NATIVE_MINTER_CONTRACT_ADDRESS, INativeMinterBinary.abi, ledger);
console.info("Creating deployer:");
console.info(`  Admin Address:       ${await ledger.getAddress()} `);
console.info(`  Deployer Address:    ${deployer.address}`);
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
    console.info(`  Deployer Address:    ${deployer.address}`);
    console.info(`  ContractDeploy Role: ${deployerContractRole.toString()} "${parseRoleNumber(deployerContractRole)}"`);
    console.info(`  NativeMinter   Role: ${deployerNativeRole.toString()} "${parseRoleNumber(deployerNativeRole)}"`);
    console.info();
    const nativeMinter = new ethers.Contract(NATIVE_MINTER_CONTRACT_ADDRESS, INativeMinterBinary.abi, deployer);
    const { tokenContract, collectionId, tokenContractOwner: tokenRole, secretName, doubleMinterAddress, doubleMinterRole } = await deployERC1155ActivityDoubleMinterWithAWS({
        identifier,
        tokenAddress,
        uri,
        maxTotalSupply: Number(maxTotalSupply),
    }, {
        deployer,
        uploadToAWS: true,
    });
    console.info(`Deployed the double minter for collection ${collectionId} @ ${tokenAddress}`);
    console.info();
    // configure double minter for this token
    console.info(`Creating new DoubleMinter for collection ${collectionId}...`);
    const doubleMinterContract = new ethers.Contract(doubleMinterAddress, ERC1155ActivitiesDoubleMinterBinary.abi, deployer);
    console.info(`  DoubleMinter: ${doubleMinterContract.address}`);
    console.info();
    console.info("Giving the DoubleMinter Role token and TOKI minting access...");
    const doubleMinterNativeEnabled = await (await nativeMinter.setEnabled(doubleMinterRole.address)).wait();
    const doubleMinterERC1155Enabled = await (await tokenContract.setEnabled(doubleMinterRole.address, collectionId)).wait();
    console.info(`  Native TOKI Minting Enabled: ${doubleMinterNativeEnabled.status}`);
    console.info(`  Collection Minting Enabled:  ${doubleMinterERC1155Enabled.status}`);
    console.info();
    console.info("Giving DoubleMinter contract token and TOKI minting access...");
    const nativeMinterEnabled = await (await nativeMinter.setEnabled(doubleMinterContract.address)).wait();
    const tokenContractEnabled = await (await tokenContract.setEnabled(doubleMinterContract.address, collectionId)).wait();
    console.info(`  Native TOKI Minting Enabled: ${nativeMinterEnabled.status}`);
    console.info(`  Collection Minting Enabled: ${tokenContractEnabled.status}`);
    console.info();
    // give ownership of double minter to token role
    {
        const oldDoubleMinterOwner = await doubleMinterContract.owner();
        console.info("Transferring DoubleMinter Contract ownership from deployer to DoubleMinterRole...");
        await (await doubleMinterContract.transferOwnership(doubleMinterRole.address)).wait();
        // Note: Disabled. Deploying 1 double minter per collection, but only 1 ERC1155 contract for everyone
        // console.info("Transferring contract ownership from deployer to token role...");
        // await (await tokenContract.transferOwnership(tokenRole.address)).wait();
        const newDoubleMinterOwner = await doubleMinterContract.owner();
        console.info(`  DoubleMinter: New: ${newDoubleMinterOwner} Old: ${oldDoubleMinterOwner}`);
        console.info();
    }
    console.info("Minting 5 TOKI to double minter account");
    await (await nativeMinterLedger.mintNativeCoin(doubleMinterRole.address, ethers.utils.parseUnits("5", 18))).wait();
    console.info();
    console.info("✅  Deployment complete! Please check AWS for the new secret. 🔑");
    {
        const addressNames = {};
        const getAddressName = (addr) => addressNames[addr] || "unknown";
        addressNames[deployer.address] = "deployer";
        addressNames[tokenRole.address] = "token";
        addressNames[doubleMinterContract.address] = "doubleMinterContract";
        addressNames[doubleMinterRole.address] = "doubleMinterRole";
        const tokenOwnerAddress = await tokenContract.owner();
        const doubleMinterOwnerAddress = await doubleMinterContract.owner();
        const tokenNativeEnabled = await isAllowedList(nativeMinter, tokenRole.address);
        console.info("Token Role Key: ");
        console.info(`  Token Role Address:    ${tokenRole.address} (${getAddressName(tokenRole.address)})`);
        console.info(`  Token Identifier:    ${identifier}`);
        console.info(`  Native Minting:      ${tokenNativeEnabled ? "Enabled" : "Disabled"}`);
        console.info(`  Secret Key:          ${secretName}`);
        console.info("  PrivateKey:          Stored in AWSSecretsManager ");
        console.info();
        console.info("Pre-Existing Deployed Token Contract: ");
        console.info(`  Token Address:       ${tokenContract.address}`);
        console.info(`  Token Owner:         ${tokenOwnerAddress} (${getAddressName(tokenOwnerAddress)})`);
        console.info();
        console.info("DoubleMinter Contract:");
        console.info(`  Contract Address:    ${doubleMinterContract.address}`);
        console.info(`  ERC1155 Minting:       ${tokenContractEnabled.status === 1 ? "Enabled" : "Disabled"}`);
        console.info(`  Native Minting:      ${nativeMinterEnabled.status === 1 ? "Enabled" : "Disabled"}`);
        console.info(`  Owner:               ${doubleMinterOwnerAddress} (${getAddressName(doubleMinterOwnerAddress)})`);
        console.info();
        console.info("DoubleMinter Role:");
        console.info(`  Address:             ${doubleMinterRole.address}`);
        console.info(`  ERC1155 Minting:       ${doubleMinterERC1155Enabled.status === 1 ? "Enabled" : "Disabled"}`);
        console.info(`  Native Minting:      ${doubleMinterNativeEnabled.status === 1 ? "Enabled" : "Disabled"}`);
        console.info("  PrivateKey:          Stored in AWSSecretsManager ");
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
    console.info(`  Deployer Address:    ${deployer.address}`);
    console.info(`  ContractDeploy Role: ${deployerContractRole.toString()} "${parseRoleNumber(deployerContractRole)}"`);
    console.info(`  NativeMinter   Role: ${deployerNativeRole.toString()} "${parseRoleNumber(deployerNativeRole)}"`);
    console.info();
}
