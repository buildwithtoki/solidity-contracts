/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type {
  DoubleMinter,
  DoubleMinterInterface,
} from "../../contracts/DoubleMinter";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "erc20Contract",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "getERC20Contract",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountNative",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountERC20",
        type: "uint256",
      },
    ],
    name: "mintTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x6080604052730200000000000000000000000000000000000001600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055503480156200006657600080fd5b5060405162000fa438038062000fa483398181016040528101906200008c91906200022a565b620000ac620000a0620000f460201b60201c565b620000fc60201b60201c565b80600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550506200025c565b600033905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620001f282620001c5565b9050919050565b6200020481620001e5565b81146200021057600080fd5b50565b6000815190506200022481620001f9565b92915050565b600060208284031215620002435762000242620001c0565b5b6000620002538482850162000213565b91505092915050565b610d38806200026c6000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c8063278a2af51461005c5780636831e2721461007a578063715018a6146100965780638da5cb5b146100a0578063f2fde38b146100be575b600080fd5b6100646100da565b604051610071919061082f565b60405180910390f35b610094600480360381019061008f91906108b1565b610104565b005b61009e6105e3565b005b6100a86105f7565b6040516100b5919061082f565b60405180910390f35b6100d860048036038101906100d39190610904565b610620565b005b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663eb54dae1306040518263ffffffff1660e01b8152600401610161919061082f565b602060405180830381865afa15801561017e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101a29190610946565b905060028114806101b35750600181145b6101f2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101e9906109f6565b60405180910390fd5b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663eb54dae1306040518263ffffffff1660e01b815260040161024f919061082f565b602060405180830381865afa15801561026c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102909190610946565b905060028114806102a15750600181145b6102e0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102d790610a88565b60405180910390fd5b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663eb54dae1336040518263ffffffff1660e01b815260040161033d919061082f565b602060405180830381865afa15801561035a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061037e9190610946565b9050600281148061038f5750600181145b6103ce576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103c590610b1a565b60405180910390fd5b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663eb54dae1336040518263ffffffff1660e01b815260040161042b919061082f565b602060405180830381865afa158015610448573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061046c9190610946565b9050600281148061047d5750600181145b6104bc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104b390610bac565b60405180910390fd5b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16634f5aaaba88886040518363ffffffff1660e01b8152600401610519929190610bdb565b600060405180830381600087803b15801561053357600080fd5b505af1158015610547573d6000803e3d6000fd5b50505050600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166379c6506888876040518363ffffffff1660e01b81526004016105a8929190610bdb565b600060405180830381600087803b1580156105c257600080fd5b505af11580156105d6573d6000803e3d6000fd5b5050505050505050505050565b6105eb6106a4565b6105f56000610722565b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6106286106a4565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610698576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161068f90610c76565b60405180910390fd5b6106a181610722565b50565b6106ac6107e6565b73ffffffffffffffffffffffffffffffffffffffff166106ca6105f7565b73ffffffffffffffffffffffffffffffffffffffff1614610720576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161071790610ce2565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610819826107ee565b9050919050565b6108298161080e565b82525050565b60006020820190506108446000830184610820565b92915050565b600080fd5b6108588161080e565b811461086357600080fd5b50565b6000813590506108758161084f565b92915050565b6000819050919050565b61088e8161087b565b811461089957600080fd5b50565b6000813590506108ab81610885565b92915050565b6000806000606084860312156108ca576108c961084a565b5b60006108d886828701610866565b93505060206108e98682870161089c565b92505060406108fa8682870161089c565b9150509250925092565b60006020828403121561091a5761091961084a565b5b600061092884828501610866565b91505092915050565b60008151905061094081610885565b92915050565b60006020828403121561095c5761095b61084a565b5b600061096a84828501610931565b91505092915050565b600082825260208201905092915050565b7f7468697320636f6e7472616374206973206e6f7420617574686f72697a65642060008201527f746f206d696e74206e617469766520746f6b656e000000000000000000000000602082015250565b60006109e0603483610973565b91506109eb82610984565b604082019050919050565b60006020820190508181036000830152610a0f816109d3565b9050919050565b7f7468697320636f6e7472616374206973206e6f7420617574686f72697a65642060008201527f746f206d696e7420455243323020746f6b656e73000000000000000000000000602082015250565b6000610a72603483610973565b9150610a7d82610a16565b604082019050919050565b60006020820190508181036000830152610aa181610a65565b9050919050565b7f73656e646572206973206e6f7420617574686f72697a656420746f206d696e7460008201527f206e617469766520746f6b656e00000000000000000000000000000000000000602082015250565b6000610b04602d83610973565b9150610b0f82610aa8565b604082019050919050565b60006020820190508181036000830152610b3381610af7565b9050919050565b7f73656e646572206973206e6f7420617574686f72697a656420746f206d696e7460008201527f20455243323020746f6b656e0000000000000000000000000000000000000000602082015250565b6000610b96602c83610973565b9150610ba182610b3a565b604082019050919050565b60006020820190508181036000830152610bc581610b89565b9050919050565b610bd58161087b565b82525050565b6000604082019050610bf06000830185610820565b610bfd6020830184610bcc565b9392505050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b6000610c60602683610973565b9150610c6b82610c04565b604082019050919050565b60006020820190508181036000830152610c8f81610c53565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b6000610ccc602083610973565b9150610cd782610c96565b602082019050919050565b60006020820190508181036000830152610cfb81610cbf565b905091905056fea2646970667358221220f02ffe3075d4a1a84d967532961e8f2745c3bb11e45ecf8ceac198a688f6884c64736f6c634300080b0033";

type DoubleMinterConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: DoubleMinterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class DoubleMinter__factory extends ContractFactory {
  constructor(...args: DoubleMinterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    erc20Contract: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<DoubleMinter> {
    return super.deploy(
      erc20Contract,
      overrides || {}
    ) as Promise<DoubleMinter>;
  }
  override getDeployTransaction(
    erc20Contract: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(erc20Contract, overrides || {});
  }
  override attach(address: string): DoubleMinter {
    return super.attach(address) as DoubleMinter;
  }
  override connect(signer: Signer): DoubleMinter__factory {
    return super.connect(signer) as DoubleMinter__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DoubleMinterInterface {
    return new utils.Interface(_abi) as DoubleMinterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): DoubleMinter {
    return new Contract(address, _abi, signerOrProvider) as DoubleMinter;
  }
}