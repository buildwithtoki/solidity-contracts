/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IAllowList,
  IAllowListInterface,
} from "../../../contracts/precompiles/IAllowList";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "readAllowList",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "setEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "setNone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IAllowList__factory {
  static readonly abi = _abi;
  static createInterface(): IAllowListInterface {
    return new utils.Interface(_abi) as IAllowListInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IAllowList {
    return new Contract(address, _abi, signerOrProvider) as IAllowList;
  }
}
