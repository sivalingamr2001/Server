import RoleGuard from "@/components/RoleGuard"
import { useAuth } from "@/context/AuthContext"
import { UserRole } from "@/lib/constants"
import { Navigate, type RouteObject } from "react-router-dom"

import AppLayout from "@/layout/AppLayout"
import { AuthLayout } from "@/layout/AuthLayout"
import ErrorBountry from "@/pages/common/ErrorBountry"
import { ProtectedRoute } from "@/pages/common/ProtectedRoute"

import * as Pages from "./pages"
import { withSuspense } from "./withSuspense"

const HomeRedirect = () => {
  const { currentUserRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const roleNameToIdMap = {
    "Admin": UserRole.Admin,
    "Operator": UserRole.Operator,
    "Hod": UserRole.Hod,
    "User": UserRole.User
  };

  const rawRoles = Array.isArray(currentUserRole) ? currentUserRole : [currentUserRole];

  const userRolesList = rawRoles.map(
    (roleName) => roleNameToIdMap[roleName as keyof typeof roleNameToIdMap]
  );

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

export const routesConfig: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBountry />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <ErrorBountry />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            path: "/unauthorized",
            element: withSuspense(Pages.UnauthorizedPage),
          },
          {
            path: "/profile",
            element: withSuspense(Pages.UserProfilePage),
          },
          {
            path: "/request/:requestId",
            element: withSuspense(Pages.RequestDetailsPage),
          },

          // --- USER PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.User, UserRole.Hod]} />,
            children: [
              {
                path: "/my-requests",
                element: withSuspense(Pages.MyRequestsPage),
              },
            ],
          },

          // --- HOD PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.Hod]} />,
            children: [
              {
                path: "/hod/pending-approvals",
                element: withSuspense(Pages.PendingApprovalsPage),
              },
              {
                path: "/hod/all-requests",
                element: withSuspense(Pages.HodAllRequestsPage),
              },
            ],
          },

          // --- OPERATOR PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.Operator]} />,
            children: [
              {
                path: "/operator/dashboard",
                element: withSuspense(Pages.DashboardPage),
              },
              {
                path: "/operator/approval-queue",
                element: withSuspense(Pages.ApprovalQueuePage),
              },
              {
                path: "/operator/all-requests",
                element: withSuspense(Pages.OperatorAllRequestsPage),
              },
            ],
          },

          // --- ADMIN PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.Admin]} />,
            children: [
              {
                path: "/dashboard",
                element: withSuspense(Pages.DashboardPage),
              },
              { path: "/users", element: withSuspense(Pages.UsersPage) },
              {
                path: "/folder-mapping",
                element: withSuspense(Pages.FolderMappingPage),
              },
              {
                path: "/admin/audit-logs",
                element: withSuspense(Pages.AuditLogsPage),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "/login", element: withSuspense(Pages.LoginPage) },
      {
        path: "/logs",
        element: withSuspense(Pages.LogViewerDashboard),
      },
    ],
  },
]
