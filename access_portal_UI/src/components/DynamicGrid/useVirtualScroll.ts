import { useCallback, useEffect, useRef, useState } from "react"
import type { BodyScrollEvent, GridApi } from "ag-grid-community"

export interface VirtualScrollConfig {
  pageSize?: number
  bufferSize?: number
  onLoadMore?: (page: number) => Promise<unknown>
  currentPage?: number
  totalPages?: number
  hasMore?: boolean
}

export interface VirtualScrollState {
  isLoading: boolean
  hasMore: boolean
  currentPage: number
  totalPages: number
}

export function useVirtualScroll(config: VirtualScrollConfig = {}) {
  const {
    pageSize = 10,
    bufferSize = 2,
    onLoadMore,
    currentPage: externalCurrentPage = 1,
    totalPages: externalTotalPages = 1,
    hasMore: externalHasMore = true,
  } = config

  const gridApiRef = useRef<GridApi | null>(null)
  const bodyScrollHandlerRef = useRef<
    ((event: BodyScrollEvent) => void) | null
  >(null)
  const configRef = useRef({
    onLoadMore,
    currentPage: externalCurrentPage,
    totalPages: externalTotalPages,
    hasMore: externalHasMore,
  })
  const [state, setState] = useState<VirtualScrollState>({
    isLoading: false,
    hasMore: externalHasMore,
    currentPage: externalCurrentPage,
    totalPages: externalTotalPages,
  })

  useEffect(() => {
    configRef.current = {
      onLoadMore,
      currentPage: externalCurrentPage,
      totalPages: externalTotalPages,
      hasMore: externalHasMore,
    }
  }, [onLoadMore, externalCurrentPage, externalTotalPages, externalHasMore])

  const handleBodyScroll = useCallback(
    async (event: BodyScrollEvent) => {
      if (
        !gridApiRef.current ||
        state.isLoading ||
        !configRef.current.hasMore ||
        !configRef.current.onLoadMore
      ) {
        return
      }

      const api = gridApiRef.current
      const rowCount = api.getDisplayedRowCount()

      if (rowCount === 0) return

      const lastRow = api.getDisplayedRowAtIndex(rowCount - 1)

      if (!lastRow) return

      const verticalRange = api.getVerticalPixelRange()
      const lastRowBottom =
        (lastRow.rowTop ?? 0) + (lastRow.rowHeight ?? pageSize * 2)
      const distanceFromBottom = lastRowBottom - verticalRange.bottom
      const thresholdPx = Math.max(200, pageSize * bufferSize * 10)
      const isNearBottom =
        event.direction === "vertical" && distanceFromBottom <= thresholdPx

      if (
        isNearBottom &&
        configRef.current.currentPage < configRef.current.totalPages
      ) {
        setState((prev) => ({ ...prev, isLoading: true }))
        try {
          const nextPage = configRef.current.currentPage + 1
          await configRef.current.onLoadMore(nextPage)
          setState((prev) => ({
            ...prev,
            currentPage: nextPage,
            isLoading: false,
          }))
        } catch (error) {
          console.error("Error loading more data:", error)
          setState((prev) => ({ ...prev, isLoading: false }))
        }
      }
    },
    [state.isLoading, pageSize, bufferSize]
  )

  const setGridApi = useCallback(
    (api: GridApi | null) => {
      if (gridApiRef.current && bodyScrollHandlerRef.current) {
        gridApiRef.current.removeEventListener(
          "bodyScroll",
          bodyScrollHandlerRef.current
        )
      }

      gridApiRef.current = api

      if (api) {
        bodyScrollHandlerRef.current = handleBodyScroll
        api.addEventListener("bodyScroll", handleBodyScroll)
      }
    },
    [handleBodyScroll]
  )

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      currentPage: externalCurrentPage,
      totalPages: externalTotalPages,
      hasMore: externalHasMore,
    }))
  }, [externalCurrentPage, externalTotalPages, externalHasMore])

  useEffect(() => {
    return () => {
      if (gridApiRef.current && bodyScrollHandlerRef.current) {
        gridApiRef.current.removeEventListener(
          "bodyScroll",
          bodyScrollHandlerRef.current
        )
      }
    }
  }, [])

  const updateState = useCallback((totalPages: number, hasMore?: boolean) => {
    setState((prev) => ({
      ...prev,
      totalPages,
      hasMore: hasMore !== undefined ? hasMore : prev.currentPage < totalPages,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      hasMore: true,
      currentPage: 1,
      totalPages: 1,
    })
    if (
      gridApiRef.current &&
      "clearServerSideDatasource" in gridApiRef.current
    ) {
      ;(gridApiRef.current as any).clearServerSideDatasource()
    }
  }, [])

  return {
    gridApiRef,
    state,
    setGridApi,
    updateState,
    reset,
  }
}
