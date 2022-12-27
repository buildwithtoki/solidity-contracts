/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "ERC1155",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155__factory>;
    getContractFactory(
      name: "IERC1155MetadataURI",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155MetadataURI__factory>;
    getContractFactory(
      name: "IERC1155",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155__factory>;
    getContractFactory(
      name: "IERC1155Receiver",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155Receiver__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Metadata__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "ERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC165__factory>;
    getContractFactory(
      name: "IERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165__factory>;
    getContractFactory(
      name: "DoubleMinter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.DoubleMinter__factory>;
    getContractFactory(
      name: "ERC1155ActivitiesDoubleMinter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155ActivitiesDoubleMinter__factory>;
    getContractFactory(
      name: "ERC1155RewardTiersDoubleMinter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155RewardTiersDoubleMinter__factory>;
    getContractFactory(
      name: "IERC1155Minter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155Minter__factory>;
    getContractFactory(
      name: "IMinter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IMinter__factory>;
    getContractFactory(
      name: "IAllowList",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IAllowList__factory>;
    getContractFactory(
      name: "IERC1155AllowList",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155AllowList__factory>;
    getContractFactory(
      name: "IFeeManager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IFeeManager__factory>;
    getContractFactory(
      name: "INativeMinter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.INativeMinter__factory>;
    getContractFactory(
      name: "RewardERC1155",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.RewardERC1155__factory>;
    getContractFactory(
      name: "RewardTierERC1155",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.RewardTierERC1155__factory>;
    getContractFactory(
      name: "TokiERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TokiERC20__factory>;

    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "ERC1155",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155>;
    getContractAt(
      name: "IERC1155MetadataURI",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155MetadataURI>;
    getContractAt(
      name: "IERC1155",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155>;
    getContractAt(
      name: "IERC1155Receiver",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155Receiver>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "IERC20Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Metadata>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "ERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC165>;
    getContractAt(
      name: "IERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC165>;
    getContractAt(
      name: "DoubleMinter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.DoubleMinter>;
    getContractAt(
      name: "ERC1155ActivitiesDoubleMinter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155ActivitiesDoubleMinter>;
    getContractAt(
      name: "ERC1155RewardTiersDoubleMinter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155RewardTiersDoubleMinter>;
    getContractAt(
      name: "IERC1155Minter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155Minter>;
    getContractAt(
      name: "IMinter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IMinter>;
    getContractAt(
      name: "IAllowList",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IAllowList>;
    getContractAt(
      name: "IERC1155AllowList",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155AllowList>;
    getContractAt(
      name: "IFeeManager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IFeeManager>;
    getContractAt(
      name: "INativeMinter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.INativeMinter>;
    getContractAt(
      name: "RewardERC1155",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.RewardERC1155>;
    getContractAt(
      name: "RewardTierERC1155",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.RewardTierERC1155>;
    getContractAt(
      name: "TokiERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TokiERC20>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
