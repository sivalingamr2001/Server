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

import { useAuth } from "@/context/AuthContext"

import { AgreementCheckbox } from "./AgreementsSection"
import AccessDetailsSection, { type RequestItem } from "./AccessDetailsSection"
import { UserSection, type UserSectionValue } from "./UserSection"
import { toast } from "sonner"
import accessManagementApi from "@/api/accessManagementApi"
import type { CreateAccessRequestWithItemsRequest } from "@/api"

export type EditRequestPayload = {
    requestId: number
    request: CreateAccessRequestWithItemsRequest["request"]
    items: RequestItem[]
}

type EditRequestModalProps = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    payload?: EditRequestPayload
    onSuccess?: () => void
}

export const EditRequestModal = ({
    isOpen,
    onOpenChange,
    payload,
    onSuccess,
}: EditRequestModalProps) => {
    const { currentUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [requestItems, setRequestItems] = useState<RequestItem[]>([
        {
            id: 1,
            accessType: "not-applicable",
            folderPath: "",
            reason: "",
        },
    ])

    const [value, setValue] = useState<
        UserSectionValue & {
            location: string
            mobile: string | number
            agreementAccepted: boolean
            itsrNumber: string
        }
    >({
        userId: currentUser?.currentUser?.cmpL_USER_ID ?? 0,
        employeeId: currentUser?.currentUser?.emP_ID ?? "",
        name: currentUser?.currentUser?.cmpL_USER_NAME ?? "",
        email: currentUser?.currentUser?.maiL_ID ?? "",
        itsrNumber: "",
        departmentName:
            currentUser?.currentUser?.depT_ID !== undefined &&
                currentUser?.currentUser?.depT_ID !== null
                ? String(currentUser.currentUser.depT_ID)
                : "",
        hodId: "",
        hodName: "",
        location: currentUser?.currentUser?.location ?? "",
        mobile: currentUser?.currentUser?.moB_NO ?? "",
        agreementAccepted: false,
    })

    useEffect(() => {
        if (!payload) return

        setValue((prev) => ({
            ...prev,
            userId: payload.request.userId,
            itsrNumber: payload.request.itsrNo ?? "",
            hodId: payload.request.reqTo,
            agreementAccepted: payload.request.isAgreed,
        }))

        setRequestItems(
            payload.items.map((item: any) => ({
                id: item.id,
                accessType:
                    item.accessType === 2
                        ? "read-only"
                        : item.accessType === 3
                            ? "read-write"
                            : "not-applicable",
                folderPath: item.folderPath,
                reason: item.reason,
            }))
        )
    }, [payload])

    const updateValue = (
        field: string,
        fieldValue: string | number | boolean
    ) => {
        setValue((prev) => ({
            ...prev,
            [field]: fieldValue,
        }))
    }

    const normalizeAccessType = (value: string): number => {
        switch (value) {
            case "read-only":
                return 2
            case "read-write":
                return 3
            default:
                return 1
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!payload) {
            toast.error("No request loaded for editing.")
            return
        }

        setIsLoading(true)

        try {
            const requestPayload: CreateAccessRequestWithItemsRequest = {
                request: {
                    userId: value.userId || currentUser?.currentUser?.cmpL_USER_ID || 0,
                    reqTo: value.hodId || payload.request.reqTo,
                    isAgreed: value.agreementAccepted,
                    itsrNo: value.itsrNumber || null,
                    currentStatus: payload.request.currentStatus,
                    currentApproverId: payload.request.currentApproverId,
                    createdBy: currentUser?.currentUser?.cmpL_USER_NAME || "system",
                },
                items: requestItems.map((item, index) => ({
                    accessRequestId: payload.requestId,
                    ticketNumber: payload.items[index]?.ticketNumber ?? "",
                    status: payload.items[index]?.status ?? 1,
                    folderPath: item.folderPath,
                    accessType: normalizeAccessType(item.accessType),
                    confirmAccessType: normalizeAccessType(
                        item.confirmAccessType ?? item.accessType
                    ),
                    reason: item.reason,
                    createdBy: currentUser?.currentUser?.cmpL_USER_NAME || "system",
                })),
            }

            await accessManagementApi.requests.updateRequest(payload.requestId, requestPayload)

            toast.success("Access request updated successfully!")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Update failed:", error)
            toast.error("Failed to update request. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-semibold text-primary">
                        Edit Request
                    </DialogTitle>
                    <DialogDescription>
                        Update the request details and resubmit the modified request.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <UserSection value={value} onChange={updateValue} />

                    <AccessDetailsSection
                        items={requestItems}
                        onItemsChange={setRequestItems}
                    />

                    <AgreementCheckbox
                        checked={value.agreementAccepted}
                        onCheckedChange={(checked) =>
                            updateValue("agreementAccepted", !!checked)
                        }
                    />

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={!value.agreementAccepted || isLoading}
                        >
                            {isLoading ? "Updating..." : "Update Request"}
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
