import { useState, useCallback, useMemo } from "react"
import type { GridReadyEvent, GridApi } from "ag-grid-community"

export const useGridControls = (onRefresh?: () => void) => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [quickFilterText, setQuickFilterText] = useState("")

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    setGridApi(event.api)
  }, [])

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setQuickFilterText(value)
    },
    []
  )

  const handleRefreshClick = useCallback(() => {
    if (!onRefresh) return
    onRefresh()
  }, [onRefresh])

  const apiValue = useMemo(
    () => ({
      gridApi,
      quickFilterText,
      handleGridReady,
      handleSearchChange,
      handleRefreshClick,
    }),
    [
      gridApi,
      quickFilterText,
      handleGridReady,
      handleSearchChange,
      handleRefreshClick,
    ]
  )

  return apiValue
}
