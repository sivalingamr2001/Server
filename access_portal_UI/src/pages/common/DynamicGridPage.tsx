import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { DataGrid } from "@/components/DynamicGrid/Index"
import { useLoader } from "@/hooks/useLoader"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useDebounce } from "@/lib/constants" // Updated import statement
import type { PagedResult } from "@/api"
import type { DynamicPageConfig } from "@/types" // Updated import statement

interface DynamicGridPageProps<T> {
  config: DynamicPageConfig<T>
  ModalComponent: React.ComponentType<any>
}

export function DynamicGridPage<T>({
  config,
  ModalComponent,
}: DynamicGridPageProps<T>) {
  const location = useLocation()
  const [expandedRowIds, setExpandedRowIds] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null)

  const [searchValue, setSearchValue] = useState("")
  const debouncedSearch = useDebounce(searchValue, 500)

  const { showLoader, hideLoader, loading: manualLoading } = useLoader()
  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const handleFetchPage = useCallback(
    async (targetPage: number, size: number): Promise<PagedResult<T>> => {
      const response = await config.fetchData(targetPage, size, debouncedSearch)

      const totalCount =
        "totalCount" in response && response.totalCount
          ? response.totalCount
          : response.data.length
      const totalPages =
        "totalPages" in response && response.totalPages
          ? response.totalPages
          : Math.ceil(totalCount / size)
      const page =
        "page" in response && response.page ? response.page : targetPage

      return {
        data: response.data || [],
        totalCount,
        page,
        pageSize: size,
        totalPages: totalPages || 1,
        hasNextPage: page < (totalPages || 1),
        hasPreviousPage: page > 1,
      }
    },
    [config, debouncedSearch]
  )

  const {
    rowData: items,
    totalPages,
    page,
    loading: gridLoading,
    loadData,
    loadMore,
  } = useInfiniteScroll<T>({
    pageSize: config.defaultPageSize || 20,
    fetchRequest: handleFetchPage,
    onError: (err) => console.error("Grid transaction failure context:", err),
  })

  useEffect(() => {
    showLoader()
    loadData(1, false).finally(hideLoader)
  }, [debouncedSearch, showLoader, hideLoader])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const toggleRowExpansion = useCallback((id: any) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const computedRowData = useMemo(() => {
    if (!config.detailSectionsConfig) return items
    const flatList: any[] = []
    items.forEach((row) => {
      const id = config.getId(row)
      flatList.push(row)
      if (expandedRowIds.includes(id)) {
        flatList.push({
          __isDetailRow: true,
          __parentData: row,
          user: { id: `detail_${id}` },
        })
      }
    })
    return flatList
  }, [items, expandedRowIds, config])

  const handleOpenEditModal = useCallback((record: T) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }, [])

  const handleOpenCreateModal = useCallback(() => {
    setSelectedRecord(null)
    setIsModalOpen(true)
  }, [])

  const columns = useMemo(
    () =>
      config.columns({
        openEditModal: handleOpenEditModal,
        toggleRowExpansion,
        expandedRowIds,
      }),
    [config, handleOpenEditModal, toggleRowExpansion, expandedRowIds]
  )

  const customActions = useMemo(
    () =>
      config.globalActions
        ? config.globalActions({ openCreateModal: handleOpenCreateModal })
        : [],
    [config, handleOpenCreateModal]
  )

  const handleSaveOrUpdate = async (modalPayload: any) => {
    try {
      showLoader()
      if (config.onUpdateRecord) {
        const targetId = selectedRecord ? config.getId(selectedRecord) : ""
        await config.onUpdateRecord(targetId, modalPayload)
      }
      await loadData(1, false)
    } catch (err) {
      console.error("Save state update transaction abort:", err)
    } finally {
      hideLoader()
      setIsModalOpen(false)
    }
  }

  const handleRefresh = useCallback(async () => {
    showLoader()
    try {
      await loadData(1, false)
    } finally {
      hideLoader()
    }
  }, [loadData, showLoader, hideLoader])

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md bg-card">
        <DataGrid
          title={title}
          rowData={computedRowData}
          rowSelection="none"
          columnDefs={columns}
          gridId={config.gridId}
          pageSize={config.defaultPageSize || 20}
          loading={gridLoading || manualLoading}
          showSearch={true}
          showRefreshButton
          showClearFiltersButton
          customActions={customActions}
          onRefresh={handleRefresh}
          onSearchChange={handleSearchChange}
          theme="system"
          masterDetail={false}
          detailSections={config.detailSectionsConfig as any}
          gridHeight="520px"
          onClearFilters={() => setSearchValue("")}
          virtualScroll={
            config.enableInfiniteScroll
              ? {
                  enabled: true,
                  pageSize: config.defaultPageSize || 20,
                  bufferSize: 3,
                  currentPage: page,
                  totalPages,
                  hasMore: page < totalPages,
                  onLoadMore: async (nextPage: number) => {
                    await loadMore(nextPage)
                  },
                }
              : undefined
          }
        />
      </div>

      <ModalComponent
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedRecord}
        userData={selectedRecord}
        departmentData={selectedRecord}
        onSuccess={handleRefresh}
        onSave={handleSaveOrUpdate}
      />
    </div>
  )
}
