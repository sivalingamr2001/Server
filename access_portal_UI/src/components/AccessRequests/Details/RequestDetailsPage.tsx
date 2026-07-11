import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import {
  accessRequestService,
  AccessItemStatus,
  type AccessRequestResponse,
  AccessType,
} from "@/api"
import { useAuth } from "@/context/AuthContext"
import RequestDetails from "./RequestDetailSheet"
import { toast } from "sonner"
import { AccessRequestBpf } from "./AccessRequestBpf"
import { ResubmitRequestModal } from "../ResubmitRequestModal"

export const RequestDetailsPage = () => {
  const { requestId } = useParams<{ requestId: string }>()
  const [searchParams] = useSearchParams()
  const selectedItemId = Number(searchParams.get("itemId") || 0)
  const { currentUserRole, currentUser } = useAuth()

  const [request, setRequest] = useState<AccessRequestResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resubmitTarget, setResubmitTarget] = useState<{
    requestId: number
    itemId: number
  } | null>(null)

  const fetchRequest = useCallback(() => {
    const accessReqId = Number(requestId)

    if (!accessReqId) {
      setRequest(null)
      setError("Invalid request id.")
      setLoading(false)
      return
    }

    let isMounted = true

    setLoading(true)
    setError(null)

    accessRequestService
      .getById(accessReqId)
      .then((response) => {
        if (!isMounted) return
        setRequest(response)
      })
      .catch(() => {
        if (!isMounted) return
        setRequest(null)
        setError("Unable to load request details.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [requestId])

  useEffect(() => fetchRequest(), [fetchRequest])

  const visibleRequest = useMemo(() => {
    if (!request) return null
    if (!selectedItemId) return request

    const selectedItem = request.items.find((item) => item.id === selectedItemId)

    return selectedItem ? { ...request, items: [selectedItem] } : request
  }, [request, selectedItemId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
        Loading request details...
      </div>
    )
  }

  if (error || !visibleRequest) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
        {error || "Request details not found."}
      </div>
    )
  }

  const refreshAfterAction = async (
    action: () => Promise<void>,
    message: string
  ) => {
    try {
      await action()
      toast.success(message)
      fetchRequest()
    } catch (actionError) {
      console.error(actionError)
      toast.error(actionError instanceof Error ? actionError.message : "An error occurred.")
    }
  }

  const handleApprove = (
    itemId: number,
    confirmAccessType?: AccessType,
    reason?: string
  ) => {
    const item = visibleRequest.items.find((candidate) => candidate.id === itemId)
    const approvalReason =
      reason ||
      (item?.status === AccessItemStatus.Submitted
        ? "Approved"
        : "Provisioned")

    if (item?.status === AccessItemStatus.Submitted) {
      refreshAfterAction(
        () =>
          accessRequestService.hodDecision(itemId, {
            accessItemId: itemId,
            status: AccessItemStatus.HodApproved,
            confirmAccessType: confirmAccessType ?? item.accessType,
            comments: approvalReason,
          }),
        "Item approved."
      )
      return
    }

    refreshAfterAction(
      () =>
        accessRequestService.operatorDecision(itemId, {
          accessItemId: itemId,
          status: AccessItemStatus.OperatorApproved,
          operatorApproverId: String(currentUser?.user?.id ?? ""),
          comments: approvalReason,
        }),
      "Item provisioned."
    )
  }

  const handleReject = (itemId: number, reason: string) => {
    const item = visibleRequest.items.find((candidate) => candidate.id === itemId)

    if (item?.status === AccessItemStatus.Submitted) {
      refreshAfterAction(
        () =>
          accessRequestService.hodDecision(itemId, {
            accessItemId: itemId,
            status: AccessItemStatus.HodRejected,
            comments: reason,
          }),
        "Item rejected."
      )
      return
    }

    refreshAfterAction(
      () =>
        accessRequestService.operatorDecision(itemId, {
          accessItemId: itemId,
          status: AccessItemStatus.OperatorRejected,
          operatorApproverId: String(currentUser?.user?.id ?? ""),
          comments: reason,
        }),
      "Item rejected."
    )
  }

  const handleRevoke = (itemId: number, reason?: string) => {
    refreshAfterAction(
      () =>
        accessRequestService.revoke(itemId, {
          accessItemId: itemId,
        }),
      reason || "Item revoked."
    )
  }

  const handleResubmit = (itemId: number, reason: string) => {
    const item = visibleRequest?.items.find((candidate) => candidate.id === itemId)

    if (!item) return

    refreshAfterAction(
      () =>
        accessRequestService.updateItem(itemId, {
          accessItemId: itemId,
          folderPath: item.folderPath,
          accessType: item.accessType,
          confirmAccessType: item.confirmAccessType ?? item.accessType,
          reasonForAccess: reason || item.reasonForAccess,
        }),
      "Item resubmitted."
    )
  }

  const openResubmitModal = (itemId: number) => {
    if (!request) return

    setResubmitTarget({ requestId: request.id, itemId })
  }

  const handleRenew = (itemId: number, reason: string, confirmAccessType?: AccessType) => {
    const item = visibleRequest.items.find((candidate) => candidate.id === itemId)

    refreshAfterAction(
      () =>
        accessRequestService.renew(itemId, {
          accessItemId: itemId,
          accessType: item?.accessType ?? AccessType.NotApplicable,
          confirmAccessType:
            confirmAccessType ?? item?.confirmAccessType ?? item?.accessType,
        }),
      reason || "Renewal request submitted."
    )
  }

  const handleExport = () => {
    const fileName =
      visibleRequest.items.length === 1
        ? `${visibleRequest.items[0].ticketNo}.json`
        : `request-${visibleRequest.id}.json`
    const blob = new Blob([JSON.stringify(visibleRequest, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectedItem = visibleRequest.items[0]

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <AccessRequestBpf
        status={selectedItem?.status ?? AccessItemStatus.Submitted}
        rejectedBy={selectedItem?.operatorApproverName ?? null}
        rejectionReason={selectedItem?.comments ?? null}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <RequestDetails
          request={visibleRequest}
          currentUserRole={currentUserRole}
          onApprove={handleApprove}
          onReject={handleReject}
          onRevoke={handleRevoke}
          onResubmit={handleResubmit}
          onOpenResubmit={openResubmitModal}
          onRenew={handleRenew}
          onExport={handleExport}
        />
      </div>

      <ResubmitRequestModal
        isOpen={Boolean(resubmitTarget)}
        onOpenChange={(open) => {
          if (!open) setResubmitTarget(null)
        }}
        requestId={resubmitTarget?.requestId ?? null}
        itemId={resubmitTarget?.itemId ?? null}
        onSuccess={() => {
          setResubmitTarget(null)
          fetchRequest()
        }}
      />
    </div>
  )
}
