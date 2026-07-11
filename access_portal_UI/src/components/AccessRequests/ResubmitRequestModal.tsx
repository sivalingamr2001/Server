import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { AgreementCheckbox } from "./AgreementsSection"
import AccessDetailsSection, { type RequestItem } from "./AccessDetailsSection"
import { toast } from "sonner"
import { accessRequestsApi } from "@/api/accessRequestsApi"
import { notificationsApi } from "@/api/notificationsApi"

type ResubmitRequestModalProps = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    requestId: number | null // Targeted request tracking variable loaded on open
    itemId?: number | null
    onSuccess?: () => void
}

export const ResubmitRequestModal = ({
    isOpen,
    onOpenChange,
    requestId,
    itemId,
    onSuccess,
}: ResubmitRequestModalProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const [requestItems, setRequestItems] = useState<RequestItem[]>([])
    const [agreementAccepted, setAgreementAccepted] = useState(false)
    const [ticketDetails, setTicketDetails] = useState<{ name?: string; ticketNo?: string }>({})

    useEffect(() => {
        if (!isOpen || !requestId) {
            setRequestItems([])
            return
        }

        const fetchRequestDetails = async () => {
            setIsLoading(true)
            try {
                const response = await accessRequestsApi.getRequestDetail(requestId, itemId ?? undefined)

                const items = response.items ?? []
                const selectedItems = itemId
                    ? items.filter((entry) => entry.itemId === itemId)
                    : items

                setTicketDetails({
                    ticketNo: selectedItems[0]?.ticketNumber ?? String(requestId),
                })

                setRequestItems(
                    selectedItems.map((item, idx) => ({
                        id: item.itemId ?? idx + 1,
                        accessType: item.accessType,
                        folderPath: item.folderPath || "",
                        reason: item.reason || "",
                    }))
                )
            } catch (error) {
                console.error("Failed to load historical request metrics:", error)
                toast.error("Failed to fetch historical request details.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchRequestDetails()
    }, [isOpen, requestId, itemId])

    // 2. Hand-off execution calling your newly exposed C# item resubmission endpoint loop
    const handleResubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!requestId || requestItems.length === 0) return

        setIsLoading(true)

        try {
            // Loop across items and re-submit any modified row identifiers
            for (const item of requestItems) {
                if (!item.id) continue

                await accessRequestsApi.resubmitItem(item.id, {
                    reason: item.reason || "Resubmitted configuration corrections.",
                })
            }

            // 3. Clear and trigger platform notifications refresh sequences
            await notificationsApi.getNotifications().catch(() => undefined)
            window.dispatchEvent(new CustomEvent("notifications:refresh"))

            toast.success("Access request items resubmitted successfully!")
            onSuccess?.()

            // Reset layout tracking hooks
            setAgreementAccepted(false)
            onOpenChange(false)
        } catch (error) {
            console.error("Resubmission loop execution failed:", error)
            toast.error("Failed to resubmit correcting details. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-semibold text-primary">
                        Resubmit Access Request
                    </DialogTitle>
                    <DialogDescription>
                        Modify and correct parameters for Request {""}
                        <span className="font-semibold text-foreground">
                            #{ticketDetails.ticketNo}
                        </span>
                        {ticketDetails.name && ` (${ticketDetails.name})`} to forward it back to HOD review.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleResubmit} className="space-y-6">

                    {/* Main folder data rows modifier view */}
                    <AccessDetailsSection
                        items={requestItems}
                        onItemsChange={setRequestItems}
                    />

                    <AgreementCheckbox
                        checked={agreementAccepted}
                        onCheckedChange={(checked) => setAgreementAccepted(!!checked)}
                    />

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={!agreementAccepted || isLoading || requestItems.length === 0}
                        >
                            {isLoading ? "Resubmitting..." : "Resubmit to HOD"}
                        </Button>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
