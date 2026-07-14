import { useAuth } from "@/context/AuthContext"
import type { UserRoleType } from "@/lib/constants"
import { Navigate, Outlet } from "react-router-dom"

interface RoleGuardProps {
  allowedRoles: UserRoleType[]
  children?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { isAuthenticated, currentUserRole } = useAuth()

  if (!isAuthenticated || !currentUserRole) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(currentUserRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RoleGuard
