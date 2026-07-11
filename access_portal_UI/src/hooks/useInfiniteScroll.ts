import { useState, useCallback } from "react"
import type { PagedResult } from "@/api"

interface UseInfiniteScrollOptions<T> {
  pageSize: number
  fetchRequest: (page: number, pageSize: number) => Promise<PagedResult<T> | T[]>
  onError?: (error: Error) => void
}

export function useInfiniteScroll<T>({
  pageSize,
  fetchRequest,
  onError,
}: UseInfiniteScrollOptions<T>) {
  const [rowData, setRowData] = useState<T[]>([])
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)

  const loadData = useCallback(
    async (targetPage: number = 1, isAppend: boolean = false) => {
      setLoading(true)
      try {
        // Safe Execution: Always points to the current active functional layer pass
        const payload = await fetchRequest(targetPage, pageSize)
        const pagedPayload = Array.isArray(payload) ? null : payload
        const rows = pagedPayload ? pagedPayload.data : payload

        setRowData((prev) =>
          isAppend ? [...prev, ...(rows as T[])] : (rows as T[])
        )
        setPage(pagedPayload?.page ?? 1)
        setTotalPages(pagedPayload?.totalPages ?? 1)
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error)
        }
      } finally {
        setLoading(false)
      }
    },
    [pageSize, onError, fetchRequest]
  )

  const loadMore = useCallback(
    async (nextPage: number) => {
      if (loading || nextPage > totalPages) return
      await loadData(nextPage, true)
    },
    [loading, totalPages, loadData]
  )

  return {
    rowData,
    page,
    totalPages,
    loading,
    loadData,
    loadMore,
  }
}
