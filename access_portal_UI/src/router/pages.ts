import { lazy } from "react"

// Auth
export const LoginPage = lazy(() =>
  import("@/pages/Auth/LoginPage").then((m) => ({ default: m.LoginPage }))
)
export const RootRedirect = lazy(() =>
  import("@/pages/common/RootRedirect").then((m) => ({
    default: m.RootRedirect,
  }))
)

export const UserProfilePage = lazy(() =>
  import("@/components/Users/UserProfilePage").then((m) => ({
    default: m.UserProfilePage,
  }))
)

// User Group
export const MyRequestsPage = lazy(() =>
  import("@/pages/Users/MyRequests").then((m) => ({
    default: m.MyRequestsPage,
  }))
)

export const RequestDetailsPage = lazy(() =>
  import("@/components/AccessRequests/Details/RequestDetailsPage").then(
    (m) => ({
      default: m.RequestDetailsPage,
    })
  )
)

// HOD Group
export const PendingApprovalsPage = lazy(() =>
  import("@/pages/Hod/HodPendingRequestsPage").then((m) => ({
    default: m.HodPendingRequestsPage,
  }))
)
export const HodAllRequestsPage = lazy(() =>
  import("@/pages/Hod/HodAllDepartmentRequestsPage").then((m) => ({
    default: m.HodAllDepartmentRequestsPage,
  }))
)

// Operator Group
export const DashboardPage = lazy(() =>
  import("@/pages/Admin/Dashboard").then((m) => ({ default: m.AccessDashboard }))
)
export const ApprovalQueuePage = lazy(() =>
  import("@/pages/Operator/OperatorPendingRequestsPage").then((m) => ({
    default: m.OperatorPendingRequestsPage,
  }))
)

export const OperatorAllRequestsPage = lazy(() =>
  import("@/pages/Operator/OperatorAllRequestsPage").then((m) => ({
    default: m.OperatorAllRequestsPage,
  }))
)

// Admin Group
export const UsersPage = lazy(() =>
  import("@/pages/Admin/UsersPage").then((m) => ({ default: m.UsersPage }))
)

export const FolderMappingPage = lazy(() =>
  import("@/pages/Admin/FolderMappingPage").then((m) => ({
    default: m.FolderMappingPage,
  }))
)
export const AuditLogsPage = lazy(() =>
  import("@/pages/common/AuditLogsPage").then((m) => ({
    default: m.AuditLogsPage,
  }))
)

// Fallback Utilities
export const UnauthorizedPage = lazy(() =>
  import("@/pages/common/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  }))
)


export const LogViewerDashboard = lazy(() =>
  import("@/pages/common/LogViewerDashboard").then((m) => ({
    default: m.LogViewerDashboard,
  }))
)