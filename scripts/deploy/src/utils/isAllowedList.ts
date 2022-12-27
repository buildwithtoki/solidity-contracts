import type { IAllowList } from "../../../../typechain-types/contracts/precompiles/IAllowList.js";

import { parseRoleNumber } from "./parseRoleNumber.js";

export async function isAllowedList(contract: IAllowList, address: string) {
  const role = await contract.readAllowList(address);
  const roleName = parseRoleNumber(role);
  return roleName === "enable" || roleName === "admin";
}
