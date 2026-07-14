import { useAuth } from "@/context/AuthContext"
import { roleStringToNumeric } from "@/lib/roleMapper"
import { UserRole } from "@/lib/constants"
import { Navigate } from "react-router-dom"

export const RootRedirect = () => {
  const { currentUserRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRoleNumeric = roleStringToNumeric(currentUserRole)

  console.log(
    "Mapped Role:",
    userRoleNumeric,
    "Expected User Enum:",
    UserRole.User
  )

  switch (userRoleNumeric) {
    case UserRole.Admin:
      return <Navigate to="/dashboard" replace />
    case UserRole.Operator: // Operator
      return <Navigate to="/operator/dashboard" replace />
    case UserRole.Hod:
      return <Navigate to="/hod/pending-approvals" replace />
    case UserRole.User:
      return <Navigate to="/my-requests" replace />
    default:
      return <Navigate to="/dashboard" replace />
  }
}
