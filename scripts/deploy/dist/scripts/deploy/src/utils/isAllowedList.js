import { parseRoleNumber } from "./parseRoleNumber.js";
export async function isAllowedList(contract, address) {
    const role = await contract.readAllowList(address);
    const roleName = parseRoleNumber(role);
    return roleName === "enable" || roleName === "admin";
}
