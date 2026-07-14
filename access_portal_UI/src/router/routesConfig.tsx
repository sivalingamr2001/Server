import RoleGuard from "@/components/RoleGuard"
import AppLayout from "@/layout/AppLayout"
import { AuthLayout } from "@/layout/AuthLayout"
import { UserRole } from "@/lib/constants"
import ErrorBoundary from "@/pages/common/ErrorBoundary"
import { ProtectedRoute } from "@/pages/common/ProtectedRoute"
import { Navigate, type RouteObject } from "react-router-dom"
import * as Pages from "./pages"
import { withSuspense } from "./withSuspense"
import { useAuth } from "@/context/AuthContext"

const HomeRedirect = () => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to="/dashboard" replace />
}

export const routesConfig: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <ErrorBoundary />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            path: "/unauthorized",
            element: withSuspense(Pages.UnauthorizedPage),
          },
          { path: "/dashboard", element: withSuspense(Pages.DashboardPage) },
          {
            path: "/request/:requestId/item/:itemId",
            element: withSuspense(Pages.RequestDetailsPage),
          },
          {
            element: <RoleGuard allowedRoles={[UserRole.User]} />,
            children: [
              {
                path: "/my-requests",
                element: withSuspense(Pages.MyRequestsPage),
              },
            ],
          },
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
          {
            element: <RoleGuard allowedRoles={[UserRole.Operator]} />,
            children: [
              {
                path: "/operator/approval-queue",
                element: withSuspense(Pages.ApprovalQueuePage),
              },
              {
                path: "/operator/active-access",
                element: withSuspense(Pages.ActiveAccessPage),
              },
              {
                path: "/operator/all-requests",
                element: withSuspense(Pages.OperatorAllRequestsPage),
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={[UserRole.Admin]} />,
            children: [
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
    children: [{ path: "/login", element: withSuspense(Pages.LoginPage) }],
  },
  {
    path: "*",
    element: <HomeRedirect />,
  },
]
