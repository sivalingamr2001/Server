import { useState } from "react"

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

type CreateRequestModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const CreateRequestModal = ({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateRequestModalProps) => {
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

  // Explicit initialization converting potential number IDs to clean string types
  const [value, setValue] = useState<UserSectionValue & { location: string; mobile: string | number; agreementAccepted: boolean; itsrNumber: string }>({
    userId: currentUser?.currentUser?.cmpL_USER_ID ?? 0,
    employeeId: currentUser?.currentUser?.emP_ID ?? "",
    name: currentUser?.currentUser?.cmpL_USER_NAME ?? "",
    email: currentUser?.currentUser?.maiL_ID ?? "",
    itsrNumber: "",
    departmentName: currentUser?.currentUser?.depT_ID !== undefined && currentUser?.currentUser?.depT_ID !== null 
      ? String(currentUser.currentUser.depT_ID) 
      : "",
    hodId: "",
    hodName: "",
    location: currentUser?.currentUser?.location ?? "",
    mobile: currentUser?.currentUser?.moB_NO ?? "",
    agreementAccepted: false,
  })

  const updateValue = (
    field: string,
    fieldValue: string | number | boolean
  ) => {
    setValue((prev) => ({
      ...prev,
      [field]: fieldValue,
    }))
  }

  // FIX 2: Updates returning codes to match the numeric API mappings (1: Not Applicable, 2: Read Only, 3: Read and Write)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!value.hodId || !value.hodId.trim()) {
      toast.error("Please search and select a Department HOD before creating a request.")
      return
    }

    setIsLoading(true)

    try {
      const payload: CreateAccessRequestWithItemsRequest = {
        request: {
          userId: value.userId || currentUser?.currentUser?.cmpL_USER_ID || 0,
          reqTo: value.hodId,
          isAgreed: value.agreementAccepted,
          itsrNo: value.itsrNumber || null,
          currentStatus: 1,               
          currentApproverId: null,        
          createdBy: currentUser?.currentUser?.cmpL_USER_NAME || "system",
        },
        items: requestItems.map((item) => ({
          accessRequestId: 0,             
          ticketNumber: "",
          status: 1,                      
          folderPath: item.folderPath,
          accessType: normalizeAccessType(item.accessType),
          confirmAccessType: normalizeAccessType(
            item.confirmAccessType ?? item.accessType
          ),
          reason: item.reason,
          createdBy: currentUser?.currentUser?.cmpL_USER_NAME || "system", 
        })),
      };

      await accessManagementApi.requests.createRequest(payload)
      
      toast.success("Access request created successfully!")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Submission failed:", error)
      toast.error("Failed to create request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isHodInvalid = !value.hodId || !value.hodId.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold text-primary">
            Create New Request
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new access request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-6">
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
              disabled={!value.agreementAccepted || isLoading || isHodInvalid}
            >
              {isLoading ? "Submitting..." : "Create Request"}
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
