import type { BigNumber } from "ethers";

export function parseRoleNumber(roleNumber: number | BigNumber) {
  const n: number = typeof roleNumber === "number" ? roleNumber : roleNumber.toNumber();

  switch (n) {
    case 0:
      return "none";

    case 1:
      return "enable";

    case 2:
      return "admin";

    default:
      return "unknown";
  }
}
