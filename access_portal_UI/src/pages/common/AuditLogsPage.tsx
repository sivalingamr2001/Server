import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { useCallback, useMemo, useState, useEffect } from "react"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useLocation } from "react-router-dom"
import type { NotificationDto } from "@/api/types"

export const AuditLogsPage = () => {
  const location = useLocation()
  const [auditLogs] = useState<NotificationDto[]>([])
  const { loading, withLoader } = useLoader()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchAuditLogs = useCallback(async () => {
    try {
      // Note: You may need to add a getNotifications method to the accessRequestApi
      // For now, we'll show the structure for audit logs
      // const data = await withLoader(() => accessRequestApi.getNotifications())
      // setAuditLogs(data)
      console.log("Audit logs API endpoint needs to be implemented")
    } catch (error) {
      console.error("Failed to load audit logs:", error)
    }
  }, [withLoader])

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const columns = useMemo<(Omit<ColDef<any>, "field"> & { field?: string })[]>(
    () => [
      {
        headerName: "Audit ID",
        field: "auditId",
        width: 100,
      },
      {
        headerName: "Event Type",
        field: "eventType",
        width: 150,
      },
      {
        headerName: "Message",
        field: "message",
        width: 300,
      },
      {
        headerName: "Is Read",
        field: "isRead",
        width: 100,
        valueFormatter: (params: any) => (params.value ? "Yes" : "No"),
      },
      {
        headerName: "Created Date",
        field: "createdAtUtc",
        width: 150,
        valueFormatter: (params: any) => {
          if (!params.value) return "-"
          return new Date(params.value).toLocaleDateString()
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <DataGrid
        rowData={auditLogs}
        columnDefs={columns}
        title={title}
        loading={loading}
        onRefresh={fetchAuditLogs}
        showRefreshButton
        showSearch
        showClearFiltersButton
        noRowsMessage="No audit logs found"
        pageSize={10}
      />
    </div>
  )
}
