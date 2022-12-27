import { ethers, Wallet } from "ethers";
import type { CreateSecretResponse } from "@aws-sdk/client-secrets-manager";

import type { TokiERC20 } from "../../../../typechain-types/contracts/TokiERC20.js";
import TokiERC20Binary from "../../../../artifacts/contracts/TokiERC20.sol/TokiERC20.json" assert { type: "json" };

import type { DoubleMinter } from "../../../../typechain-types/contracts/DoubleMinter.js";
import DoubleMinterBinary from "../../../../artifacts/contracts/DoubleMinter.sol/DoubleMinter.json" assert { type: "json" };

import type { RewardERC1155 } from "../../../../typechain-types/contracts/RewardERC1155.js";
import RewardERC1155Binary from "../../../../artifacts/contracts/RewardERC1155.sol/RewardERC1155.json" assert { type: "json" };

import type { ERC1155ActivitiesDoubleMinter } from "../../../../typechain-types/contracts/ERC1155ActivitiesDoubleMinter.js";
import ERC1155ActivitiesDoubleMinterBinary from "../../../../artifacts/contracts/ERC1155ActivitiesDoubleMinter.sol/ERC1155ActivitiesDoubleMinter.json" assert { type: "json" };

import type { RewardTierERC1155 } from "../../../../typechain-types/contracts/RewardTierERC1155.js";
import RewardTierERC1155Binary from "../../../../artifacts/contracts/RewardTierERC1155.sol/RewardTierERC1155.json" assert { type: "json" };

import type { ERC1155RewardTiersDoubleMinter } from "../../../../typechain-types/contracts/ERC1155RewardTiersDoubleMinter.js";
import ERC1155RewardTiersDoubleMinterBinary from "../../../../artifacts/contracts/ERC1155RewardTiersDoubleMinter.sol/ERC1155RewardTiersDoubleMinter.json" assert { type: "json" };

import { SecretsManager } from "@aws-sdk/client-secrets-manager";

type TokiERC20Info = {
  identifier: string;
  name: string;
  symbol: string;
  decimals: number;
};

type RewardERC1155Info = {
  identifier: string;
};

type RewardERC1155DoubleMinterInfo = {
  identifier: string;
  tokenAddress: string;
  uri: string;
  maxTotalSupply: number;
};

type RewardTierERC1155Info = {
  identifier: string;
  creatorAddress: string;
  maxTotalSupplies: number[];
  rewardTierNames: string[];
  requiredRewardAmounts: number[];
  uris: string[];
};

type DeployTokenOptions = {
  deployer: Wallet;
  uploadToAWS: boolean;
};

type ERC20DeployOutput = {
  secretName: string;
  tokenContract: TokiERC20;
  tokenContractOwner: Wallet;
  doubleMinterAddress: string;
  doubleMinterRole: Wallet;
};

type ERC1155RewardDeployOutput = {
  secretName: string;
  tokenContract: RewardERC1155;
  tokenContractOwner: Wallet;
};

type ERC1155RewardDoubleMinterDeployOutput = {
  secretName: string;
  tokenContract: RewardERC1155;
  collectionId: string;
  tokenContractOwner: Wallet;
  doubleMinterAddress: string;
  doubleMinterRole: Wallet;
};

type ERC1155RewardTierDeployOutput = {
  secretName: string;
  tokenContract: RewardTierERC1155;
  tokenContractOwner: Wallet;
  doubleMinterAddress: string;
  doubleMinterRole: Wallet;
};

export async function deployERC20WithAWS(
  { identifier, name, symbol, decimals }: TokiERC20Info,
  { deployer, uploadToAWS }: DeployTokenOptions,
): Promise<ERC20DeployOutput> {
  const secretName = getSecretNameFor(identifier);
  let secret: CreateSecretResponse;
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

  const newTokenWallet = Wallet.createRandom().connect(deployer.provider);
  const doubleMinterRole = Wallet.createRandom().connect(deployer.provider);

  const tokenFactory = new ethers.ContractFactory(TokiERC20Binary.abi, TokiERC20Binary.bytecode, deployer);
  const tokenContract = await tokenFactory.deploy(
    name,
    symbol,
    {
      gasLimit: tokenFactory.signer.estimateGas({ from: deployer.getAddress(), data: tokenFactory.getDeployTransaction(name, symbol).data! }),
      gasPrice: tokenFactory.signer.getGasPrice(),
    },
  ) as TokiERC20;

  const doubleMinterFactory = new ethers.ContractFactory(DoubleMinterBinary.abi, DoubleMinterBinary.bytecode, deployer);
  const doubleMinterContract = await doubleMinterFactory.deploy(
    tokenContract.address,
    {
      gasLimit: doubleMinterFactory.signer.estimateGas({ from: deployer.getAddress(), data: doubleMinterFactory.getDeployTransaction(tokenContract.address).data! }),
      gasPrice: doubleMinterFactory.signer.getGasPrice(),
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

export async function deployERC1155ActivityWithAWS(
  { identifier }: RewardERC1155Info,
  { deployer, uploadToAWS }: DeployTokenOptions,
): Promise<ERC1155RewardDeployOutput> {
  const secretName = getSecretNameFor(identifier);
  let secret: CreateSecretResponse;
  if (uploadToAWS) {
    secret = await createSecretInAWS(
      secretName,
      {
        identifier,
        tokenAddress: null,
        tokenOwnerAddress: null,
        tokenOwnerPrivateKey: null,
      },
    );
  }
  else {
    console.info("Skipping AWS secret upload");
  }

  const newTokenWallet = Wallet.createRandom().connect(deployer.provider);

  const tokenFactory = new ethers.ContractFactory(RewardERC1155Binary.abi, RewardERC1155Binary.bytecode, deployer);
  const tokenContract = await tokenFactory.deploy({
    gasLimit: tokenFactory.signer.estimateGas({ from: deployer.getAddress(), data: tokenFactory.getDeployTransaction().data! }),
    gasPrice: tokenFactory.signer.getGasPrice(),
  }) as RewardERC1155;

  if (uploadToAWS) {
    await updateSecretInAWS(
      secret!.ARN!,
      {
        identifier,
        tokenAddress: tokenContract.address,
        tokenOwnerAddress: newTokenWallet.address,
        tokenOwnerPrivateKey: newTokenWallet.privateKey,
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
  };
}

export async function deployERC1155ActivityDoubleMinterWithAWS(
  { identifier, tokenAddress, uri, maxTotalSupply }: RewardERC1155DoubleMinterInfo,
  { deployer, uploadToAWS }: DeployTokenOptions,
): Promise<ERC1155RewardDoubleMinterDeployOutput> {
  const secretName = getSecretNameFor(identifier);
  let secret: CreateSecretResponse;
  if (uploadToAWS) {
    secret = await createSecretInAWS(
      secretName,
      {
        identifier,
        tokenAddress,
        uri,
        maxTotalSupply,
        collectionId: null,
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

  const newTokenWallet = Wallet.createRandom().connect(deployer.provider);
  const doubleMinterRole = Wallet.createRandom().connect(deployer.provider);

  const tokenContract = new ethers.Contract(tokenAddress, RewardERC1155Binary.abi, deployer.provider) as RewardERC1155;
  const tokenCollection = await (await tokenContract.createCollection(doubleMinterRole.address, uri, maxTotalSupply)).wait();
  if (!tokenCollection.events || tokenCollection.events.length)
    throw new Error("Could not create collection");

  // @ts-expect-error expected
  const [ collectionId ]: [ string ] = tokenCollection.events[0].args;

  const doubleMinterFactory = new ethers.ContractFactory(ERC1155ActivitiesDoubleMinterBinary.abi, ERC1155ActivitiesDoubleMinterBinary.bytecode, deployer);
  const doubleMinterContract = await doubleMinterFactory.deploy(
    tokenAddress,
    collectionId,
    {
      gasLimit: doubleMinterFactory.signer.estimateGas({ from: deployer.getAddress(), data: doubleMinterFactory.getDeployTransaction(tokenAddress, collectionId).data! }),
      gasPrice: doubleMinterFactory.signer.getGasPrice(),
    },
  ) as ERC1155ActivitiesDoubleMinter;

  if (uploadToAWS) {
    await updateSecretInAWS(
      secret!.ARN!,
      {
        identifier,
        tokenAddress,
        uri,
        maxTotalSupply,
        collectionId: `${ collectionId }`,
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
    collectionId,
    tokenContractOwner: newTokenWallet,
    doubleMinterAddress: doubleMinterContract.address,
    doubleMinterRole,
  };
}

export async function deployERC1155RewardTierWithAWS(
  { identifier, creatorAddress, maxTotalSupplies, rewardTierNames, requiredRewardAmounts, uris }: RewardTierERC1155Info,
  { deployer, uploadToAWS }: DeployTokenOptions,
): Promise<ERC1155RewardTierDeployOutput> {
  const secretName = getSecretNameFor(identifier);
  let secret: CreateSecretResponse;
  if (uploadToAWS) {
    secret = await createSecretInAWS(
      secretName,
      {
        identifier,
        creatorAddress,
        maxTotalSupplies,
        rewardTierNames,
        requiredRewardAmounts,
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

  const newTokenWallet = Wallet.createRandom().connect(deployer.provider);
  const doubleMinterRole = Wallet.createRandom().connect(deployer.provider);

  const tokenFactory = new ethers.ContractFactory(RewardTierERC1155Binary.abi, RewardTierERC1155Binary.bytecode, deployer);
  const tokenContract = await tokenFactory.deploy(creatorAddress, maxTotalSupplies, rewardTierNames, requiredRewardAmounts, uris, {
    gasLimit: tokenFactory.signer.estimateGas({ from: deployer.getAddress(), data: tokenFactory.getDeployTransaction(creatorAddress, maxTotalSupplies, rewardTierNames, requiredRewardAmounts).data! }),
    gasPrice: tokenFactory.signer.getGasPrice(),
  }) as RewardTierERC1155;

  const doubleMinterFactory = new ethers.ContractFactory(ERC1155RewardTiersDoubleMinterBinary.abi, ERC1155RewardTiersDoubleMinterBinary.bytecode, deployer);
  const doubleMinterContract = await doubleMinterFactory.deploy(creatorAddress, maxTotalSupplies, rewardTierNames, requiredRewardAmounts, uris, {
    gasLimit: doubleMinterFactory.signer.estimateGas({ from: deployer.getAddress(), data: doubleMinterFactory.getDeployTransaction(tokenContract.address).data! }),
    gasPrice: doubleMinterFactory.signer.getGasPrice(),
  }) as ERC1155RewardTiersDoubleMinter;

  if (uploadToAWS) {
    await updateSecretInAWS(
      secret!.ARN!,
      {
        identifier,
        creatorAddress,
        maxTotalSupplies,
        rewardTierNames,
        requiredRewardAmounts,
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

function getSecretNameFor(identifier: string) {
  return `token/${ identifier }/keys`;
}

async function createSecretInAWS(secretName: string, secretAsObj: AWSSecret) {
  console.info(`Creating ${ secretName } in AWS SecretsManager`);
  const secretManager = new SecretsManager({});
  try {
    const secretInfo = await secretManager.createSecret({
      Name: secretName,
      SecretString: JSON.stringify(secretAsObj),
    });

    console.info(secretInfo);
    console.info(`Successfully saved to ${ secretName } to AWS SecretsManager`);
    return secretInfo;
  }
  catch (e) {
    const error = e as Error;
    console.error(error);
    throw Error(`Failed to save secret to AWS SecretsManager: ${ error.name }: ${ error.message }`);
  }
}

async function updateSecretInAWS(secretId: string, secretAsObj: AWSSecret) {
  console.info(`Updating ${ secretId } in AWS SecretsManager`);
  const secretManager = new SecretsManager({});
  try {
    const secretInfo = await secretManager.updateSecret({
      SecretId: secretId,
      SecretString: JSON.stringify(secretAsObj),
    });

    console.info(secretInfo);
    console.info(`Successfully updated ${ secretId } in AWS SecretsManager`);
    return secretInfo;
  }
  catch (e) {
    const error = e as Error;
    console.error(error);
    throw Error(`Failed to update secret to AWS SecretsManager: ${ error.name }: ${ error.message }`);
  }
}

type AWSSecret = {
  identifier: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  uri?: string;
  creatorAddress?: string;
  maxTotalSupply?: number;
  maxTotalSupplies?: number[];
  rewardTierNames?: string[];
  requiredRewardAmounts?: number[];
  uris?: string[];
  collectionId?: string | null;
  tokenAddress: string | null;
  tokenOwnerAddress: string | null;
  tokenOwnerPrivateKey: string | null;
  doubleMinterAddress?: string | null;
  doubleMinterRoleAddress?: string | null;
  doubleMinterRolePrivateKey?: string | null;
};
