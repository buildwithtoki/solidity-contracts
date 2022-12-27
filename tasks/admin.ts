import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { TokiERC20 } from "../typechain-types/contracts";
import type { IAllowList } from "../typechain-types/contracts/precompiles";
import { parseRoleNumber } from "../util";
import { ALLOW_LISTS } from "./precompiles";

task(
  "adminSet",
  "Set the user's on-chain permissions with precompile contracts",
)
  .addParam("listname", "deploy-contract | native-mint | tx")
  .addParam("wallet", "address of user to set")
  .addParam("role", "none | enable | admin")
  .setAction(async ({
    wallet,
    role,
    listname,
  }, hre) => {
    const listAddr = ALLOW_LISTS.find(list => list.aliases.includes(listname))?.address;
    if (listAddr === undefined) {
      console.error(`Unknown list name: ${ listname }`);
      console.error("Valid list names:");
      ALLOW_LISTS.forEach(list => {
        console.error(`${ list.name.padEnd(25) }:   ${ list.aliases.toString() }`);
      });
      return;
    }

    const allowList = await hre.ethers.getContractAt("IAllowList", listAddr) as IAllowList;

    const oldRoleNum = await allowList.readAllowList(wallet);
    if (parseRoleNumber(oldRoleNum) === role) {
      console.log(`${ wallet } already has role ${ role }`);
      return;
    }

    if (role === "admin")
      await allowList.setAdmin(wallet);

    else if (role === "enable")
      await allowList.setEnabled(wallet);

    else if (role === "none")
      await allowList.setNone(wallet);


    const newRoleNum = await allowList.readAllowList(wallet);
    if (parseRoleNumber(newRoleNum) === role)
      console.error(`Successfully set ${ wallet } to role ${ parseRoleNumber(newRoleNum) }`);
    else
      console.error(`Failed to set ${ wallet } to ${ role }. Role is currently ${ parseRoleNumber(newRoleNum) }`);
  });

task(
  "adminRead",
  "Read the user's role",
)
  .addParam("wallet", "address of user to set")
  .setAction(async ({
    listname,
    wallet,
  }, hre) => {
    for (const { name, address } of ALLOW_LISTS) {
      const allowList = await hre.ethers.getContractAt("IAllowList", address) as IAllowList;

      const roleNum = await allowList.readAllowList(wallet);
      console.log(`${ name.padEnd(25) }: ${ parseRoleNumber(roleNum) }`);
    }
  });

task(
  "readAllowList",
  "Read the user's role",
)
  .addParam("address", "address of user")
  .addParam("contract", "address of contract")
  .setAction(async ({
    address,
    contract,
  }, { ethers }: HardhatRuntimeEnvironment) => {
    const allowList = await ethers.getContractAt("IAllowList", contract) as IAllowList;
    const roleNum = await allowList.readAllowList(address);
    console.log(`Role: ${ parseRoleNumber(roleNum) }`);
  });

task(
  "setRole",
  "Set a user's role",
)
  .addParam("address", "address of user to set")
  .addParam("contract", "address of contract")
  .addParam("rolenumber", "role number to set. Either 0 (none), 1 (enable), or 2 (admin)")
  .setAction(async ({
    address,
    contract,
    rolenumber,
  }, { ethers }: HardhatRuntimeEnvironment) => {
    const allowList = await ethers.getContractAt("IAllowList", contract) as IAllowList;
    switch (rolenumber) {
      case "0":
        await allowList.setNone(address);
        break;

      case "1":
        await allowList.setEnabled(address);
        break;

      case "2":
        await allowList.setAdmin(address);
        break;

      default:
        throw new Error(`Invalid role number: ${ rolenumber }`);
    }
    const roleNum = await allowList.readAllowList(address);
    console.log(`Set Role: ${ parseRoleNumber(roleNum) }`);
  });
