export function parseRoleNumber(roleNumber) {
    const n = typeof roleNumber === "number" ? roleNumber : roleNumber.toNumber();
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
