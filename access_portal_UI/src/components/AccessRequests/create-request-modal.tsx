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
import { accessRequestService, AccessType, userService, type CreateAccessRequestWithItemsDto } from "@/api"

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

  // Explicit initialization to prevent number-to-string type overlap assignments
  const [value, setValue] = useState({
    userId: currentUser?.user?.id ?? 0,
    employeeId: currentUser?.user?.employeeId ?? "",
    name: currentUser?.user?.name ?? "",
    email: currentUser?.user?.email ?? "",
    itsrNumber: "",
    departmentName: currentUser?.department?.name ?? (currentUser?.department?.id ? String(currentUser.department.id) : ""),
    hodId: currentUser?.headOfDepartment?.employeeId ?? currentUser?.headOfDepartment?.email ?? "",
    hodName: currentUser?.headOfDepartment?.name ?? "",
    location: currentUser?.user?.location ?? "",
    mobile: currentUser?.user?.mobileNumber ?? "",
    agreementAccepted: false,
  })

  const handleUserChange = async (
    field: keyof typeof value | keyof UserSectionValue,
    fieldValue: any
  ) => {
    updateValue(field as any, fieldValue)

    if (field !== "userId" || !fieldValue) return

    const userId = Number(fieldValue)
    if (!userId) return

    const response = await userService.getUserPortalProfileById(userId.toString())

    if (!response) return

    const user = response

    setValue((prev) => ({
      ...prev,
      userId: user.userId ?? 0,
      employeeId: user?.empId ?? "",
      name: user?.userName ?? "",
      email: user?.mailId ?? "",
      departmentName: user?.deptId,
      hodName: "",
      hodId: "",
    }))
  }

  const updateValue = (
    field: keyof typeof value,
    fieldValue: string | number | boolean
  ) => {
    setValue((prev) => ({
      ...prev,
      [field]: fieldValue,
    }))
  }

  const normalizeAccessType = (value: number): AccessType => {
    switch (value) {
      case 1:
        return "ReadOnly"
      case 2:
        return "ReadandWrite"
      default:
        return "NotApplicable"
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Guard Statement: Terminate submission if HOD unique identifier is empty
    if (!value.hodId || !value.hodId.trim()) {
      toast.error("Please search and select a Department HOD before creating a request.")
      return
    }

    setIsLoading(true)

    try {
      const payload: any = {
        requestedTo: value.hodId,
        isAgreed: value.agreementAccepted,
        itsrNo: value.itsrNumber || null,
        items: requestItems.map((item) => ({
          folderPath: item.folderPath,
          accessType: normalizeAccessType(item.accessType),
          confirmAccessType: normalizeAccessType(
            item.confirmAccessType ?? item.accessType
          ),
          reason: item.reason,
        })),
      }

      const request = await accessRequestService.create(payload)

      if (request.id > 0) {
        toast.success("Access request submitted successfully!")
        setRequestItems([
          {
            id: 1,
            accessType: "not-applicable",
            folderPath: "",
            reason: "",
          },
        ])
        setValue((prev) => ({
          ...prev,
          itsrNumber: "",
          agreementAccepted: false,
        }))
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Submission failed:", error)
      toast.error("Failed to create request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Evaluates checking criteria locally to keep button bindings accurate
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
          <UserSection value={value} onChange={handleUserChange} />

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
            {/* 3. Combined disabled logic checking both the legal policy state and HOD selection */}
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
