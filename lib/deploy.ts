/**
 * Functions in this file should not import the hardhat runtime, but rather
 * inject it as a function dependency.
 * Functions in this file can be imported by tasks.
 */
import type { BigNumber, BigNumberish, Signer, Wallet } from "ethers";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { NativeMinterAddress } from "../tasks/precompiles";
import type { DoubleMinter, TokiERC20 } from "../typechain-types/contracts";
import type { INativeMinter } from "../typechain-types/contracts/precompiles";
import AWS from "aws-sdk";
import assert from "assert";
import type { Provider } from "@ethersproject/providers";

/**
 * Deploys a new ERC20 token contract with its own key.
 * The key is then stored into AWS secrets manager.
 */
type DeployOutput = {
  secretName: string;
  tokenContract: TokiERC20;
  tokenContractOwner: Wallet;
  doubleMinterAddress: string;
  doubleMinterRole: Wallet;
};

type DeployTokenOptions = {
  deployerPrivateKey: string;
  uploadToAWS: boolean;
};
type TokenInfo = {
  identifier: string;
  name: string;
  symbol: string;
  decimals: number;
};

type FundAccountOptions = {
  accountAddress: string;
  minimumFunding: BigNumber;
  signer: Signer;
  provider: Provider;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
};

export async function fundAccount({ provider, accountAddress, minimumFunding, signer }: FundAccountOptions, { ethers }: HardhatRuntimeEnvironment) {
  const nativeMinter = await ethers.getContractAt("INativeMinter", NativeMinterAddress) as INativeMinter;
  nativeMinter.connect(signer);

  const balance = await provider.getBalance(accountAddress);
  if (balance.lt(minimumFunding)) {
    const diffBalance = minimumFunding.sub(balance);
    assert(diffBalance.gte(0));
    console.info(`fundAccount: Minting ${ diffBalance.toString() } native FMU to ${ accountAddress }...`);
    const tx = await nativeMinter.mintNativeCoin(accountAddress, diffBalance, {
      gasLimit: await nativeMinter.estimateGas.mintNativeCoin(accountAddress, diffBalance),
      gasPrice: await provider.getGasPrice(),
    });
    await tx.wait();
  }
}

export async function deployERC20WithAWS(
  { identifier, name, symbol, decimals }: TokenInfo,
  { deployerPrivateKey, uploadToAWS }: DeployTokenOptions,
  hre: HardhatRuntimeEnvironment,
): Promise<DeployOutput> {
  const secretName = getSecretNameFor(identifier);
  let secret: AWS.SecretsManager.CreateSecretResponse;
  if (uploadToAWS) {
    secret = await createSecretInAWS(
      secretName,
      {
        name,
        symbol,
        decimals,
        identifier,
        tokenAddress: null,
        tokenOwnerAddress: null,
        tokenOwnerPrivateKey: null,
        doubleMinterAddress: null,
        doubleMinterRoleAddress: null,
        doubleMinterRolePrivateKey: null,
      },
    );
  }
  else {
    console.info("Skipping AWS secret upload");
  }

  const { ethers } = hre;

  const deployer = new ethers.Wallet(deployerPrivateKey)
    .connect(ethers.provider);
  const newTokenWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  const doubleMinterRole = ethers.Wallet.createRandom().connect(ethers.provider);

  const tokenFactory = (await ethers.getContractFactory("TokiERC20")).connect(deployer);
  const tokenContract = await tokenFactory.deploy(
    name,
    symbol,
    {
      gasLimit: await ethers.provider.estimateGas({ data: tokenFactory.getDeployTransaction(name, symbol).data! }),
      gasPrice: await ethers.provider.getGasPrice(),
    },
  ) as TokiERC20;


  const doubleMinterFactory = await ethers.getContractFactory("DoubleMinter", deployer);
  const doubleMinterContract = await doubleMinterFactory.deploy(
    tokenContract.address,
    {
      gasLimit: await ethers.provider.estimateGas({ data: doubleMinterFactory.getDeployTransaction(tokenContract.address).data! }),
      gasPrice: await ethers.provider.getGasPrice(),
    },
  ) as DoubleMinter;

  if (uploadToAWS) {
    await updateSecretInAWS(
      secret!.ARN!,
      {
        name,
        symbol,
        decimals,
        identifier,
        tokenAddress: tokenContract.address,
        tokenOwnerAddress: newTokenWallet.address,
        tokenOwnerPrivateKey: newTokenWallet.privateKey,
        doubleMinterAddress: doubleMinterContract.address,
        doubleMinterRoleAddress: doubleMinterRole.address,
        doubleMinterRolePrivateKey: doubleMinterRole.privateKey,
      },
    );
  }
  else {
    console.info("Skipping AWS secret upload");
  }

  return {
    secretName,
    tokenContract,
    tokenContractOwner: newTokenWallet,
    doubleMinterAddress: doubleMinterContract.address,
    doubleMinterRole,
  };
}

async function createSecretInAWS(secretName: string, secretAsObj: AWSSecret) {
  console.info(`Creating ${ secretName } in AWS SecretsManager`);
  const secretManager = new AWS.SecretsManager();
  const request = secretManager.createSecret({
    Name: secretName,
    SecretString: JSON.stringify(secretAsObj),
  }).promise();

  const { error, data } = (await request).$response;

  if (error) {
    console.error({ error });
    throw Error(`Failed to save secret to AWS SecretsManager: ${ error.name }: ${ error.message }`);
  }
  else {
    console.info({ data });
    console.info(`Successfully saved to ${ secretName } to AWS SecretsManager`);
    return data as AWS.SecretsManager.CreateSecretResponse;
  }
}

async function updateSecretInAWS(secretId: string, secretAsObj: AWSSecret) {
  console.info(`Updating ${ secretId } in AWS SecretsManager`);
  const secretManager = new AWS.SecretsManager();
  const request = secretManager.updateSecret({
    SecretId: secretId,
    SecretString: JSON.stringify(secretAsObj),
  }).promise();

  const { error, data } = (await request).$response;

  if (error) {
    console.error({ error });
    throw Error(`Failed to save secret to AWS SecretsManager: ${ error.name }: ${ error.message }`);
  }
  else {
    console.info({ data });
    console.info(`Successfully saved to ${ secretId } to AWS SecretsManager`);
  }
}

export function getSecretNameFor(identifier: string) {
  return `token/${ identifier }/keys`;
}


export async function getAWSSecret(identifier: string): Promise<AWSSecret> {
  const secretName = getSecretNameFor(identifier);
  const secretManager = new AWS.SecretsManager();
  const request = secretManager
    .getSecretValue({ SecretId: secretName })
    .promise();
  const { error, data } = (await request).$response;

  if (error) {
    console.error({ error });
    throw Error(`Failed to get secret from AWS SecretsManager: ${ error.name }: ${ error.message }`);
  }
  else {
    console.info(`Successfully retrieved ${ secretName } from AWS SecretsManager`);
  }

  const secretResponse = data as AWS.SecretsManager.GetSecretValueResponse;
  const obj = JSON.parse(secretResponse.SecretString!) as AWSSecret;
  return obj;
}

/**
 * The JSON of this will be stored as a secret in AWS secrets manager.
 */
export type AWSSecret = {
  identifier: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenAddress: string | null;
  tokenOwnerAddress: string | null;
  tokenOwnerPrivateKey: string | null;
  doubleMinterAddress: string | null;
  doubleMinterRoleAddress: string | null;
  doubleMinterRolePrivateKey: string | null;
};
