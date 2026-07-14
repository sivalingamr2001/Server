import type { ColDef, GridOptions } from "ag-grid-community"

export interface GridActionButton {
  label: string
  onClick: () => void
  variant?: "primary" | "secondary" | "danger"
  isDisabled?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export interface Props {
  title: string
  description?: string
  isLoading?: boolean
  rowData: any[]
  columnDefs: ColDef[]
  hasSearch?: boolean
  hasRefresh?: boolean
  onRefresh?: () => void
  actionButtons?: GridActionButton[]
  PageSize?: number
  PageNumber?: number
  PageOptions?: number[]
  gridOptions?: GridOptions
}
