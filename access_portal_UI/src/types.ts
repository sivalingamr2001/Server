import type { ColDef } from "ag-grid-community"
import type { AccessItemStatus, AccessType } from "./api"

export interface PagedResult<T> {
  data: T[]
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface RequestGridRow {
  requestId: number
  itemId: number
  ticketNumber: string
  folderPath: string
  accessType: AccessType
  status: AccessItemStatus
  requestedBy: string
  departmentName?: string
}

export interface DynamicPageConfig<T> {
  gridId: string
  fetchData: (
    page: number,
    pageSize: number,
    search?: string
  ) => Promise<PagedResult<T> | { data: T[]; totalCount?: number }>
  onUpdateRecord?: (id: number | string, modalPayload: any) => Promise<void>
  getId: (record: T) => number | string
  columns: (helpers: {
    openEditModal: (record: T) => void
    toggleRowExpansion?: (id: any) => void
    expandedRowIds?: any[]
  }) => (Omit<ColDef<any>, "field"> & { field?: string })[]
  globalActions?: (helpers: {
    openCreateModal: () => void
  }) => {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "ghost" | "destructive"
  }[]
  detailSectionsConfig?: { title: string; objectKey: keyof T & string }[]
  enableInfiniteScroll?: boolean
  defaultPageSize?: number
}
