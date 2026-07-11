import { UserRole } from "./constants"

/**
 * Maps API role strings or arrays of roles to an array of numeric role constants.
 * API returns: "User", "Admin", "Operator", "HOD" or ["Hod", "Admin"]
 * Constants use numeric values: 1=Admin, 2=It/Operator, 3=HOD, 4=User
 */
export const roleStringToNumeric = (
  roleString: string | string[] | null | undefined
): number[] => {
  if (!roleString) return [UserRole.User]

  // Clean lookup dictionary map with lowercase keys for bulletproof case-insensitive matching
  const roleMap: Record<string, number> = {
    admin: UserRole.Admin,
    operator: UserRole.Operator,
    hod: UserRole.Hod,
    user: UserRole.User,
  }

  // 1. If it's an array, process every single role inside it
  if (Array.isArray(roleString)) {
    const numericRoles = roleString
      .map((role) => roleMap[String(role).toLowerCase()] ?? null) // Normalize case before lookup
      .filter((role): role is number => role !== null) // Strip away unmatched null keys

    return numericRoles.length > 0 ? numericRoles : [UserRole.User]
  }

  // 2. Fallback logic if a single string is passed (wrapped cleanly in an array response)
  const singleResult = roleMap[String(roleString).toLowerCase()] ?? UserRole.User
  return [singleResult]
}

/**
 * Maps numeric role to string representation for logging/display
 */
export const numericToRoleString = (roleNumber: number): string => {
  const reverseMap: Record<number, string> = {
    [UserRole.Admin]: "Admin",
    [UserRole.Operator]: "Operator",
    [UserRole.Hod]: "HOD",
    [UserRole.User]: "User",
  }

  return reverseMap[roleNumber] ?? "Unknown"
}

/**
 * Gets allowed roles for a page/route
 * Uses flatMap to combine nested array responses into a flat number[] list
 */
export const getAllowedRoles = (roleNames: string[]): number[] => {
  // flatMap automatically flattens [[1], [3, 4]] down into a flat array [1, 3, 4]
  return roleNames.flatMap((role) => roleStringToNumeric(role))
}
