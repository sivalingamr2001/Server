import { Spinner } from "@/components/ui/spinner"
import { useTheme } from "@/context/theme-provider"
import { themeBalham } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import React, { useMemo } from "react"
import { Header } from "./Header"
import { useGridControls } from "./hooks/useGridControls"
import type { Props } from "./types"

const DEFAULT_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE_SELECTOR = [50, 100, 200, 500, 1000]

export const DynamicGrid: React.FC<
  Props & { isLoading?: boolean; rowActions?: any[] }
> = ({
  title,
  description,
  rowData,
  columnDefs,
  hasSearch = true,
  hasRefresh = false,
  onRefresh,
  actionButtons = [],
  gridOptions,
  isLoading = false,
  rowActions = [],
}) => {
  const { theme } = useTheme()
  const {
    quickFilterText,
    handleGridReady,
    handleSearchChange,
    handleRefreshClick,
  } = useGridControls(onRefresh)

  const isDark = useMemo(() => theme === "dark", [theme])

  const memoizedGridOptions = useMemo(
    () => ({
      pagination: true,
      paginationPageSize: DEFAULT_PAGE_SIZE,
      paginationPageSizeSelector: DEFAULT_PAGE_SIZE_SELECTOR,
      ...gridOptions,
    }),
    [gridOptions, rowActions]
  )

  const activeTheme = useMemo(
    () =>
      themeBalham.withParams({
        backgroundColor: isDark ? "#09090b" : "#ffffff",
        foregroundColor: isDark ? "#fafafa" : "#09090b",
        headerBackgroundColor: isDark ? "#18181b" : "#f4f4f5",
        borderColor: isDark ? "#27272a" : "#e4e4e7",
        rowHoverColor: isDark ? "#1e1e24" : "#f5f5f5",
      }),
    [isDark]
  )

  return (
    <div className="flex h-full w-full flex-col bg-transparent">
      <Header
        title={title}
        description={description}
        hasSearch={hasSearch}
        searchValue={quickFilterText}
        onSearchChange={handleSearchChange}
        hasRefresh={hasRefresh}
        onRefreshClick={handleRefreshClick}
        actionButtons={actionButtons}
        isLoading={isLoading}
      />
      <div className="relative min-h-100 w-full flex-1 overflow-hidden rounded-xl border border-zinc-200 shadow-2xl dark:border-zinc-800">
        <AgGridReact
          theme={activeTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          quickFilterText={quickFilterText}
          onGridReady={handleGridReady}
          gridOptions={memoizedGridOptions}
        />
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1.5px]">
            <Spinner className="size-5 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

export default DynamicGrid
