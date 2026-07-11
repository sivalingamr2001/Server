import { useState, useRef, useCallback, useEffect } from "react"
import type {
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent,
  FilterChangedEvent,
  SortChangedEvent,
  PaginationChangedEvent,
} from "ag-grid-community"
import type { DataGridProps, DataGridState, UseDataGridReturn } from "./types"

export function useDataGrid<TData extends object>(
  props: DataGridProps<TData>
): UseDataGridReturn<TData> {
  const gridApiRef = useRef<GridApi<TData> | null>(null)

  const [state, setState] = useState<DataGridState>({
    quickFilter: "",
    selectedCount: 0,
    totalRows: props.rowData?.length || 0,
    filteredRows: props.rowData?.length || 0,
    currentPage: 1,
    totalPages: 1,
    activeFiltersCount: 0,
    isRefreshing: false,
  })

  const syncGridState = useCallback(() => {
    const api = gridApiRef.current
    if (!api) return

    const displayedRows = api.getDisplayedRowCount()
    const activeFilters = Object.keys(api.getFilterModel() || {}).length

    setState((prev) => ({
      ...prev,
      selectedCount: api.getSelectedRows().length,
      filteredRows: displayedRows,
      currentPage: api.paginationGetCurrentPage() + 1,
      totalPages: api.paginationGetTotalPages(),
      activeFiltersCount: activeFilters,
    }))
  }, [])

  const onGridReady = useCallback(
    (event: GridReadyEvent<TData>) => {
      gridApiRef.current = event.api

      if (props.gridId) {
        const savedSize = localStorage.getItem(`dg_ps_${props.gridId}`)
        if (savedSize) {
          event.api.setGridOption("paginationPageSize", parseInt(savedSize, 10))
        } else if (props.pageSize) {
          event.api.setGridOption("paginationPageSize", props.pageSize)
        }
      } else if (props.pageSize) {
        event.api.setGridOption("paginationPageSize", props.pageSize)
      }

      syncGridState()
      if (props.onGridReady) props.onGridReady(event.api)
    },
    [props.gridId, props.pageSize, props.onGridReady, syncGridState]
  )

  const onQuickFilterChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, quickFilter: value }))

      if (gridApiRef.current) {
        gridApiRef.current.setGridOption("quickFilterText", value)
      }

      props.onSearchChange?.(value)
    },
    [props]
  )

  const onClearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, quickFilter: "", activeFiltersCount: 0 }))

    if (gridApiRef.current) {
      // API Fix: Replaced deprecated `.setSortModel(null)` with standard `applyColumnState` call sequence
      gridApiRef.current.setFilterModel(null)
      gridApiRef.current.setGridOption("quickFilterText", "")
      gridApiRef.current.applyColumnState({
        defaultState: { sort: null },
      })
    }

    props.onSearchChange?.("")
  }, [props])

  const onRefresh = useCallback(async () => {
    if (props.onRefresh) {
      setState((prev) => ({ ...prev, isRefreshing: true }))
      try {
        await props.onRefresh()
      } finally {
        setState((prev) => ({ ...prev, isRefreshing: false }))
      }
    }
  }, [props.onRefresh])

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<TData>) => {
      syncGridState()
      if (props.onSelectionChanged)
        props.onSelectionChanged(event.api.getSelectedRows())
    },
    [props.onSelectionChanged, syncGridState]
  )

  const onFilterChanged = useCallback(
    (event: FilterChangedEvent<TData>) => {
      syncGridState()
      if (props.onFilterChanged) props.onFilterChanged(event)
    },
    [props.onFilterChanged, syncGridState]
  )

  const onSortChanged = useCallback(
    (event: SortChangedEvent<TData>) => {
      syncGridState()
      if (props.onSortChanged) props.onSortChanged(event)
    },
    [props.onSortChanged, syncGridState]
  )

  const onPaginationChanged = useCallback(
    (event: PaginationChangedEvent<TData>) => {
      syncGridState()
      if (props.onPaginationChanged) props.onPaginationChanged(event)
    },
    [props.onPaginationChanged, syncGridState]
  )

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      totalRows: props.rowData?.length || 0, // State synchronization safely executed here
    }))
    syncGridState()
  }, [props.rowData, syncGridState])

  return {
    gridApiRef,
    state,
    handlers: {
      onGridReady,
      onQuickFilterChange,
      onClearFilters,
      onRefresh,
      onSelectionChanged,
      onFilterChanged,
      onSortChanged,
      onPaginationChanged,
    },
  }
}
