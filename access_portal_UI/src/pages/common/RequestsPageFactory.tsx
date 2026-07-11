import type { ColDef } from "ag-grid-community"
import { Pen } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { userService } from "@/api/userApi"
import { CreateRequestModal } from "@/components/AccessRequests/create-request-modal"
import { DataGrid } from "@/components/DynamicGrid/Index"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { AccessItemStatus, AccessType } from "@/api"
import type { PagedResult, RequestGridRow } from "@/types"

interface RequestsPageFactoryProps<TRequest extends object = RequestGridRow> {
  fetchApiFn: (id?: string) => Promise<PagedResult<TRequest> | TRequest[] | any[]>
  actionButtonLabel?: string
  actionButtonRoutePrefix: string
  extraColumns?: (Omit<ColDef<any>, "field"> & { field?: string })[]
  showCreateButton?: boolean
}

const mapAccessType = (value: number | null | undefined): AccessType => {
  switch (value) {
    case AccessType.ReadOnly:
      return AccessType.ReadOnly
    case AccessType.ReadAndWrite:
      return AccessType.ReadAndWrite
    default:
      return AccessType.NotApplicable
  }
}

const mapStatus = (value: number | null | undefined): AccessItemStatus => {
  switch (value) {
    case AccessItemStatus.Submitted:
      return AccessItemStatus.Submitted
    case AccessItemStatus.HodApproved:
      return AccessItemStatus.HodApproved
    case AccessItemStatus.HodRejected:
      return AccessItemStatus.HodRejected
    case AccessItemStatus.OperatorApproved:
      return AccessItemStatus.OperatorApproved
    case AccessItemStatus.OperatorRejected:
      return AccessItemStatus.OperatorRejected
    case AccessItemStatus.AccessGranted:
      return AccessItemStatus.AccessGranted
    case AccessItemStatus.AccessDenied:
      return AccessItemStatus.AccessDenied
    case AccessItemStatus.AccessExpired:
      return AccessItemStatus.AccessExpired
    case AccessItemStatus.AccessRevoked:
      return AccessItemStatus.AccessRevoked
    default:
      return AccessItemStatus.Submitted
  }
}

export const RequestsPageFactory = <TRequest extends object = RequestGridRow>({
  fetchApiFn,
  extraColumns = [],
  showCreateButton = false,
}: RequestsPageFactoryProps<TRequest>) => {
  const location = useLocation()
  const { currentUser } = useAuth()
  const { loading, withLoader } = useLoader()
  const [requests, setRequests] = useState<TRequest[]>([])
  const [createRequestModalOpen, setCreateRequestModalOpen] = useState(false)
  const [userNames, setUserNames] = useState<Record<string | number, string>>({})
  const navigate = useNavigate()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchRequests = useCallback(async () => {
    const targetId = currentUser?.user?.id ? String(currentUser.user.id) : undefined

    try {
      const result = await withLoader(() => fetchApiFn(targetId))
      setRequests(Array.isArray(result) ? result : result.data ?? [])
    } catch (error) {
      console.error("Error fetching requests:", error)
    }
  }, [currentUser, fetchApiFn, withLoader])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  useEffect(() => {
    const loadMissingNames = async () => {
      if (!requests.length) return

      const uniqueUserIds = new Set<string | number>()

      requests.forEach((req: any) => {
        const requestUserId = req?.requesterId ?? req?.requesterUserId ?? req?.requestedBy
        if (requestUserId) uniqueUserIds.add(requestUserId)

        const itemList = Array.isArray(req?.items) ? req.items : []
        itemList.forEach((item: any) => {
          if (item?.operatorApproverId) uniqueUserIds.add(item.operatorApproverId)
        })
      })

      const missingIds = Array.from(uniqueUserIds).filter((id) => !userNames[id])
      if (!missingIds.length) return

      const updatedNamesMap = { ...userNames }

      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const profile = await userService.getUserPortalProfileById(String(id))
            updatedNamesMap[id] = profile?.userName || profile?.mailId || `User #${id}`
          } catch {
            updatedNamesMap[id] = `User #${id}`
          }
        })
      )

      setUserNames(updatedNamesMap)
    }

    loadMissingNames()
  }, [requests, userNames])

  const handleActionClick = (data: RequestGridRow): void => {
    const currentItemId = data.itemId
    const itemQuery = currentItemId ? `?itemId=${currentItemId}` : ""
    navigate(`/request/${data.requestId}${itemQuery}`)
  }

  const flattenedRowData = useMemo<RequestGridRow[]>(() => {
    return requests.flatMap((req: any) => {
      const requestId = req?.id ?? req?.requestId ?? 0
      const requesterId = req?.requesterId ?? req?.requesterUserId ?? ""
      const rawItems = Array.isArray(req?.items) ? req.items : []

      if (!rawItems.length) return []

      return rawItems.map((item: any) => ({
        requestId,
        itemId: item?.id ?? item?.itemId ?? 0,
        ticketNumber: item?.ticketNo ?? item?.ticketNumber ?? `REQ-${requestId}`,
        folderPath: item?.folderPath ?? "",
        accessType: mapAccessType(item?.accessType),
        status: mapStatus(item?.status),
        requestedBy: userNames[requesterId] || req?.requesterName || `User #${requesterId}`,
        departmentName: req?.requestedTo || req?.departmentName,
      }))
    })
  }, [requests, userNames])

  const coreColumns = useMemo<
    (Omit<ColDef<any>, "field"> & { field?: string })[]
  >(
    () => [
      {
        headerName: "Ticket Number",
        field: "ticketNumber",
        width: 220,
      },
      {
        headerName: "Folder Path",
        field: "folderPath",
        flex: 1,
      },
      {
        headerName: "Access Type",
        field: "accessType",
        width: 140,
      },
      {
        headerName: "Status",
        field: "status",
        width: 140,
      },
      ...extraColumns,
      {
        headerName: "Actions",
        sortable: false,
        filter: false,
        width: 90,
        cellRenderer: (params: any) => {
          if (!params.data) return null

          return (
            <div className="mt-2 flex h-full items-center justify-center">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleActionClick(params.data)}
              >
                <Pen />
              </Button>
            </div>
          )
        },
      },
    ],
    [extraColumns]
  )

  const customActions = useMemo(() => {
    if (!showCreateButton) return []
    return [
      {
        label: "Create New Request",
        onClick: () => setCreateRequestModalOpen(true),
      },
    ]
  }, [showCreateButton])

  return (
    <div className="space-y-4">
      <DataGrid
        rowData={flattenedRowData}
        columnDefs={coreColumns}
        title={title}
        loading={loading}
        onRefresh={fetchRequests}
        showRefreshButton
        showSearch
        showClearFiltersButton
        customActions={customActions}
        noRowsMessage="No access requests found"
        pageSize={10}
        rowSelection="none"
      />

      {showCreateButton && (
        <CreateRequestModal
          isOpen={createRequestModalOpen}
          onOpenChange={setCreateRequestModalOpen}
        />
      )}
    </div>
  )
}
