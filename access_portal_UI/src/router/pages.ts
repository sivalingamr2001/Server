import { lazy } from "react"

export const LoginPage = lazy(() =>
  import("@/pages/common/LoginPage").then((m) => ({ default: m.LoginPage }))
)
export const RootRedirect = lazy(() =>
  import("@/pages/common/RootRedirect").then((m) => ({
    default: m.RootRedirect,
  }))
)

export const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard }))
)

export const UnauthorizedPage = lazy(() =>
  import("@/pages/common/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  }))
)

export const MyRequestsPage = lazy(() =>
  import("@/pages/user/MyRequestsPage").then((m) => ({
    default: m.MyRequestsPage,
  }))
)

export const RequestDetailsPage = lazy(() =>
  import("@/pages/common/RequestDetails").then((m) => ({
    default: m.RequestDetails,
  }))
)

export const PendingApprovalsPage = lazy(() =>
  import("@/pages/hod/PendingApprovalsPage").then((m) => ({
    default: m.PendingApprovalsPage,
  }))
)
export const HodAllRequestsPage = lazy(() =>
  import("@/pages/hod/HodAllRequestsPage").then((m) => ({
    default: m.HodAllRequestsPage,
  }))
)

export const ApprovalQueuePage = lazy(() =>
  import("@/pages/operator/ApprovalQueuePage").then((m) => ({
    default: m.ApprovalQueuePage,
  }))
)
export const ActiveAccessPage = lazy(() =>
  import("@/pages/operator/ActiveAccessPage").then((m) => ({
    default: m.ActiveAccessPage,
  }))
)
export const OperatorAllRequestsPage = lazy(() =>
  import("@/pages/operator/OperatorAllRequestsPage").then((m) => ({
    default: m.OperatorAllRequestsPage,
  }))
)

export const UsersPage = lazy(() =>
  import("@/pages/admin/UsersPage").then((m) => ({ default: m.UsersPage }))
)
export const FolderMappingPage = lazy(() =>
  import("@/pages/admin/FolderMappingPage").then((m) => ({
    default: m.FolderMappingPage,
  }))
)
export const AuditLogsPage = lazy(() =>
  import("@/pages/admin/AuditLogsPage").then((m) => ({
    default: m.AuditLogsPage,
  }))
)
