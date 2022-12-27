type AllowLists = {
  name: string;
  aliases: string[];
  address: string;
}[];

export const ContractAllowListAddress = "0x0200000000000000000000000000000000000000";
export const NativeMinterAddress = "0x0200000000000000000000000000000000000001";
export const TxAllowListAddress = "0x0200000000000000000000000000000000000002";
export const FeeConfigManagerAddress = "0x0200000000000000000000000000000000000003";

export const ALLOW_LISTS: AllowLists = [
  {
    name: "ContractDeployerAllowList",
    aliases: [ "deploy-contract", "contract", "deployer", "deploy", "deployment", "contract-deployment" ],
    address: ContractAllowListAddress,
  },
  {
    name: "ContractNativeMinter",
    aliases: [ "minter", "native", "native-minter", "native-mint", "mint" ],
    address: NativeMinterAddress,
  },
  {
    name: "TxAllowList",
    aliases: [ "tx", "transaction" ],
    address: TxAllowListAddress,
  },
];
