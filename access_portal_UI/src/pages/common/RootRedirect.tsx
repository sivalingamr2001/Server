import { useAuth } from "@/context/AuthContext"
import { roleStringToNumeric } from "@/lib/roleMapper"
import { UserRole } from "@/lib/constants"
import { Navigate } from "react-router-dom"

export const RootRedirect = () => {
  const { currentUserRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 1. Normalize into a raw array while treating null/undefined as an empty array
  const incomingRoles = Array.isArray(currentUserRole) 
    ? currentUserRole 
    : currentUserRole 
      ? [currentUserRole] 
      : [];

  // 2. Filter out any null elements and explicitly type as clean string[]
  const rawRoles: string[] = incomingRoles.filter(
    (role): role is string => typeof role === 'string'
  );

  // 3. Now .flatMap will compile cleanly without type issues
  const userRolesList: number[] = rawRoles.flatMap((role) => roleStringToNumeric(role));

  if (userRolesList.includes(UserRole.Admin)) {
    return <Navigate to="/dashboard" replace />
  }
  if (userRolesList.includes(UserRole.Operator)) {
    return <Navigate to="/operator/dashboard" replace />
  }
  if (userRolesList.includes(UserRole.Hod)) {
    return <Navigate to="/hod/pending-approvals" replace />
  }
  if (userRolesList.includes(UserRole.User)) {
    return <Navigate to="/my-requests" replace />
  }

  return <Navigate to="/unauthorized" replace />
}
