import {
  FileText,
  CheckSquare,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  Users,
  Building2,
  FolderTree,
} from "lucide-react"
import { UserRole, type UserRoleType } from "../constants"

export interface SidebarGroupItem {
  label: string
  desc?: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRoleType[]
}

export interface SidebarGroup {
  title: string
  items: SidebarGroupItem[]
}

export const sidebarItems: SidebarGroup[] = [
  {
    title: "User",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: [UserRole.User],
      },
      {
        label: "My Requests",
        desc: "View and manage your access requests",
        to: "/my-requests",
        icon: FileText,
        roles: [UserRole.User],
      },
    ],
  },
  {
    title: "HOD",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: [UserRole.Hod],
      },
      {
        label: "Pending Approvals",
        desc: "Review and approve pending access requests",
        to: "/hod/pending-approvals",
        icon: CheckSquare,
        roles: [UserRole.Hod],
      },
      {
        label: "All Requests",
        to: "/hod/all-requests",
        icon: FileText,
        roles: [UserRole.Hod],
      },
    ],
  },
  {
    title: "Operator",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: [UserRole.Operator],
      },
      {
        label: "Approval Queue",
        to: "/operator/approval-queue",
        icon: ShieldCheck,
        roles: [UserRole.Operator],
      },
      {
        label: "Active Access",
        to: "/operator/active-access",
        icon: Clock,
        roles: [UserRole.Operator],
      },
      {
        label: "All Requests",
        to: "/operator/all-requests",
        icon: FileText,
        roles: [UserRole.Operator],
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: [UserRole.Admin],
      },
      {
        label: "Users",
        to: "/users",
        icon: Users,
        roles: [UserRole.Admin],
      },
      {
        label: "Folder Mapping",
        to: "/folder-mapping",
        icon: FolderTree,
        roles: [UserRole.Admin],
      },
      {
        label: "Audit Logs",
        to: "/admin/audit-logs",
        icon: FileText,
        roles: [UserRole.Admin],
      },
    ],
  },
]
