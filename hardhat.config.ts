import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-contract-sizer";

import "./tasks/admin";
import "./tasks/balances";
import "./tasks/deploy";
import "./tasks/precompiles";
import "./tasks/wallet";

import * as dotenv from "dotenv";
import type { Wallet } from "ethers";
import fs from "fs";
import type { HardhatUserConfig } from "hardhat/types";

dotenv.config();

const {
  TOKI_NETWORK,
  TOKI_DEPLOYER_PRIVATE_KEY,
  LOCAL_RPC_URL,
} = process.env;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [ { version: "0.8.11" } ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 2 ** 32 - 1,
      },
    },
  },
  networks: {
    local: {
      url: LOCAL_RPC_URL! || "http://127.0.0.1:9658/ext/bc/43uEE2nFfUWVZxaTJnMzZe1crj1LgGSf7fbJUPj7J3dSXA1Ur/rpc",
      chainId: 99999,
      accounts: getPrivateKeys("./test/configs/test_wallets.json"),
    },
    ...TOKI_NETWORK === "testnet"
      ? {
        "toki-testnet": {
          url: "https://testnet.buildwithtoki.com/v0/rpc",
          chainId: 8655,
          accounts: [
            `0x${ TOKI_DEPLOYER_PRIVATE_KEY! }`,
          ],
        },
      }
      : TOKI_NETWORK === "mainnet"
        ? {
          "toki-mainnet": {
            url: "https://mainnet.buildwithtoki.com/v0/rpc",
            chainId: 8654,
            accounts: [
              `0x${ TOKI_DEPLOYER_PRIVATE_KEY! }`,
            ],
          },
        }
        : {},
  },
  mocha: {
    timeout: 1200000,
  },
};

type WalletWithMnemonic = {
  mnemonic: string;
  privateKey: string;
} & Wallet;

// TODO move this to the test file
function getPrivateKeys(filename: string): string[] {
  if (!fs.existsSync(filename)) {
    console.warn("No private keys found. Run \"yarn run generate-wallets\" to generate them.");
    return [];
  }

  const wallets = JSON.parse(fs.readFileSync(filename, "utf8")) as WalletWithMnemonic[];
  const ret: string[] = [];
  wallets.forEach((w: WalletWithMnemonic) => {
    if (w.privateKey)
      ret.push(w.privateKey);
  });

  // console.info(`Loaded ${ ret.length } private keys from ${ filename }`);
  return ret;
}

export default config;
