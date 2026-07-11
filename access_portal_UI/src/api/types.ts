import type { AccessItemStatus, AccessType } from "./accessRequestApi"

export interface Result<T> {
  isSuccess: boolean
  value?: T
  error?: {
    code?: string
    message?: string
  }
}

export interface PagedResult<T> {
  data: T[]
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface NotificationDto {
  id?: number | string
  title?: string
  message?: string
  createdAt?: string
  userId?: string | number
  read?: boolean
}

export interface PortalUserDetails {
  user?: {
    id?: number | string
    employeeId?: string
    displayName?: string
    name?: string
    email?: string
    mobileNumber?: string | number | null
    role?: string | string[]
    location?: string
  }
  department?: {
    id?: number | string | null
    name?: string
    departmentId?: number | string | null
  }
  headOfDepartment?: {
    id?: number | string
    employeeId?: string
    name?: string
    email?: string
  }
}

export interface FolderMappingDto {
  id?: number | string
  folderPath?: string | null
  primaryHodId?: string | null
  primaryHodName?: string | null
  primaryHodEmail?: string | null
  secondaryHodId?: string | null
  secondaryHodName?: string | null
  secondaryHodEmail?: string | null
}

export interface UpsertFolderMappingRequest {
  folderPath: string
  primaryHodId: string | null
  primaryHodName?: string | null
  primaryHodEmail?: string | null
  secondaryHodId: string | null
  secondaryHodName?: string | null
  secondaryHodEmail?: string | null
}

export type ApiException = Error & {
  status?: number
  response?: {
    data?: unknown
  }
}

export const getUserId = (
  user?: {
    user?: {
      id?: string | number
    } | null
  } | null
): string => {
  const targetId = user?.user?.id
  return targetId == null ? "" : String(targetId)
}

export type RequestGridRow = {
  requestId: number
  itemId: number
  ticketNumber: string
  folderPath: string
  accessType: AccessType
  status: AccessItemStatus
  requestedBy: string
  departmentName?: string
}
