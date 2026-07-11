import type { UserRoleType } from "@/components/RoleGuard"
import {
  CheckSquare,
  FileText,
  FolderTree,
  LayoutDashboard,
  ShieldCheck,
  Users
} from "lucide-react"

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
        label: "My Requests",
        desc: "View and manage your access requests",
        to: "/my-requests",
        icon: FileText,
        roles: [4], // UserRole.User
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
        roles: [1], // UserRole.Admin
      },
      {
        label: "Users",
        to: "/users",
        icon: Users,
        roles: [1], // UserRole.Admin
      },
      {
        label: "Folder Mapping",
        to: "/folder-mapping",
        icon: FolderTree,
        roles: [1], // UserRole.Admin
      },
      {
        label: "Audit Logs",
        to: "/admin/audit-logs",
        icon: FileText,
        roles: [], // UserRole.Admin
      },
    ],
  },
  {
    title: "HOD",
    items: [
      {
        label: "My Requests",
        desc: "View and manage your access requests",
        to: "/my-requests",
        icon: FileText,
        roles: [3], // UserRole.User
      },
      {
        label: "Pending Approvals",
        desc: "Review and approve pending access requests",
        to: "/hod/pending-approvals",
        icon: CheckSquare,
        roles: [3], // UserRole.Hod
      },
      {
        label: "All Requests",
        to: "/hod/all-requests",
        icon: FileText,
        roles: [3], // UserRole.Hod
      },
    ],
  },
  {
    title: "Operator",
    items: [
      {
        label: "Dashboard",
        to: "/operator/dashboard",
        icon: LayoutDashboard,
        roles: [2], // UserRole.It / Operator
      },
      {
        label: "Approval Queue",
        to: "/operator/approval-queue",
        icon: ShieldCheck,
        roles: [2], // UserRole.It / Operator
      },
      {
        label: "All Requests",
        to: "/operator/all-requests",
        icon: FileText,
        roles: [2], // UserRole.It / Operator
      },
    ],
  },
]
