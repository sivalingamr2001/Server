import { useEffect, useState } from "react"
import { folderMappingsApi } from "@/api"
import { FolderMappingModal } from "@/components/FolderMapping/FolderMappingModal"
import type { DynamicPageConfig } from "@/types"
import { DynamicGridPage } from "../common/DynamicGridPage"
import type { FolderMappingDto } from "@/api/types"

const folderConfig: DynamicPageConfig<FolderMappingDto> = {
  gridId: "folder_mapping_grid",
  enableInfiniteScroll: false,
  defaultPageSize: 10,
  getId: (item) => item.id ?? 0,
  fetchData: async () => {
    const res = await folderMappingsApi.getFolderMappings()
    return { data: res.data }
  },
  globalActions: ({ openCreateModal }) => [
    {
      label: "Create Folder Mapping",
      onClick: openCreateModal,
      variant: "default",
    },
  ],
  columns: ({ openEditModal }) => [
    { headerName: "ID", field: "id", width: 80 },
    { headerName: "Folder Path", field: "folderPath", width: 250 },
    { headerName: "Primary HOD Name", field: "primaryHodName", width: 150 },
    { headerName: "Primary HOD Email", field: "primaryHodEmail", width: 200 },
    { headerName: "Secondary HOD Name", field: "secondaryHodName", width: 150 },
    {
      headerName: "Secondary HOD Email",
      field: "secondaryHodEmail",
      width: 200,
    },
    {
      headerName: "Actions",
      width: 100,
      cellRenderer: (params: any) =>
        params.data && (
          <button
            onClick={() => openEditModal(params.data)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Edit
          </button>
        ),
    },
  ],
}

export const FolderMappingPage = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey((prev) => prev + 1)
    }

    window.addEventListener("folder-mapping-refresh", handleRefresh)

    return () => {
      window.removeEventListener("folder-mapping-refresh", handleRefresh)
    }
  }, [])

  return (
    <DynamicGridPage
      key={refreshKey}
      config={folderConfig}
      ModalComponent={FolderMappingModal}
    />
  )
}
