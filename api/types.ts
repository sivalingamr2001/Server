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
