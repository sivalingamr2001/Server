import { useAuth } from "@/context/AuthContext"
import { UserRole } from "@/lib/constants"
import { roleStringToNumeric } from "@/lib/roleMapper"
import React from "react"
import { Navigate, Outlet } from "react-router-dom"

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

interface RoleGuardProps {
  allowedRoles: UserRoleType[]
  children?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { isAuthenticated, currentUserRole } = useAuth()

  if (!isAuthenticated || !currentUserRole) {
    return <Navigate to="/login" replace />
  }

  // 1. This is now an array of numbers: e.g., [3, 1]
  const activeRolesList = roleStringToNumeric(currentUserRole)

  // 2. Check if AT LEAST ONE of the user's roles matches the allowedRoles array
  const hasAccess = allowedRoles.some((role) => activeRolesList.includes(role))

  if (!hasAccess) {
    console.warn(
      `User with roles '${JSON.stringify(currentUserRole)}' does not have access to allowed roles: ${allowedRoles.join(", ")}`
    )
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RoleGuard
