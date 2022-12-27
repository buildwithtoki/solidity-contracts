/* eslint-disable no-console */
import fs from "fs";
import { ethers } from "ethers";
import { task, types } from "hardhat/config";
import { generateWallets, printToFile } from "../util";


task(
  "generateWallets",
  "Generates 10 wallets to json through stdout",
)
  .addOptionalParam("file", "filename to write instead of printing to stdout")
  .addOptionalParam("num", "Number of wallets to generate. Default 10", 10, types.int)
  .setAction(async ({ file, num }, hre) => {
    const json = JSON.stringify(generateWallets(num, hre));
    console.log(`Generated ${ num } wallets`);
    if (file !== undefined) {
      console.log(`Writing to ${ file }`);
      printToFile(json, file);
    }
    else {
      console.log(json);
    }
  });
