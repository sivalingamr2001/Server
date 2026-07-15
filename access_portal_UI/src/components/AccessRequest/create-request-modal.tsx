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
import { accessRequestService, type AccessType, type CreateAccessRequestWithItemsDto, userService } from "@/api"

type CreateRequestModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Unified interface matching our React SelectedHod structure safely
export interface SelectedHod {
  userId: number
  employeeId: string
  email: string
  hodName: string
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

  // Track the collection of HODs parsed down from your API backend response payload
  const [hodOptions, setHodOptions] = useState<SelectedHod[]>([])

  const [value, setValue] = useState<UserSectionValue & { location: string; mobile: string | number; agreementAccepted: boolean; itsrNumber: string }>({
    userId: currentUser?.currentUser?.userId ?? 0,
    employeeId: currentUser?.currentUser?.empId ?? "",
    name: currentUser?.currentUser?.userName ?? "",
    email: currentUser?.currentUser?.mailId ?? "",
    itsrNumber: "",
    departmentName: currentUser?.currentUser?.deptId !== undefined && currentUser?.currentUser?.deptId !== null
      ? String(currentUser.currentUser.deptId)
      : "",
    hodId: "",
    hodName: "",
    location: currentUser?.currentUser?.location ?? "",
    mobile: currentUser?.currentUser?.mobNo ?? "",
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

  // Handle updates when the child HOD selector changes options explicitly
  const handleHodOptionSelected = (selected: SelectedHod) => {
    setValue((prev) => ({
      ...prev,
      hodId: selected.employeeId,
      hodName: selected.hodName,
    }))
  }

  const parseFolderPathForLookup = (folderPath: string) => {
    const normalizedPath = folderPath.trim().replace(/\//g, "\\")

    if (!normalizedPath) return ""

    const segments = normalizedPath.split("\\").filter(Boolean)
    if (segments.length >= 3) {
      return `${segments[0]}\\${segments[1]}\\${segments[2]}`
    }

    return normalizedPath
  }

  const handleFolderPathSelected = async (_itemId: number, folderPath: string) => {
    const parsedPath = parseFolderPathForLookup(folderPath)
    if (!parsedPath) return

    try {
      // Call your updated backend endpoint returning the payload container structure
      const response: any = await accessRequestService.getHodIdByFolderPath(parsedPath)

      if (!response) {
        toast.error(`No HOD configurations found for folder path: ${parsedPath}`)
        return
      }

      const { primaryHod, secondaryHod } = response
      const loadedOptions: SelectedHod[] = []

      // Map incoming primary HOD data down natively to layout interface structures
      if (primaryHod) {
        loadedOptions.push({
          userId: Number(primaryHod.userId ?? 0),
          employeeId: String(primaryHod.empId || "").trim(),
          email: String(primaryHod.mailId || "").trim(),
          hodName: String(primaryHod.userName || "").trim(),
        })
      }

      // Map secondary configuration properties dynamically if they exist 
      if (secondaryHod) {
        loadedOptions.push({
          userId: Number(secondaryHod.userId ?? 0),
          employeeId: String(secondaryHod.empId || "").trim(),
          email: String(secondaryHod.mailId || "").trim(),
          hodName: String(secondaryHod.userName || "").trim(),
        })
      }

      setHodOptions(loadedOptions)

      // Automatically default to the primary HOD option to keep form filling fast
      if (loadedOptions.length > 0) {
        setValue((prev) => ({
          ...prev,
          hodId: loadedOptions[0].employeeId,
          hodName: loadedOptions[0].hodName,
        }))
        toast.info(`HOD updated to: ${loadedOptions[0].employeeId} - ${loadedOptions[0].hodName}`)
      } else {
        toast.error("HOD record configurations retrieved were blank or invalid.")
      }

    } catch (error) {
      console.error("Failed to resolve HOD from folder path:", error)
      toast.error("Unable to resolve the HOD for the selected folder path.")
    }
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!value.hodId || !value.hodId.trim()) {
      toast.error("Please search and select a Department HOD before creating a request.")
      return
    }

    setIsLoading(true)

    try {
      const payload: CreateAccessRequestWithItemsDto = {
        request: {
          requesterId: String(value.userId || currentUser?.currentUser?.cmpL_USER_ID || 0),
          requestedTo: String(value.hodId || ""),
          itsrNo: value.itsrNumber || null,
        },
        items: requestItems.map((item) => ({
          folderPath: item.folderPath,
          accessType: normalizeAccessType(item.accessType) as AccessType,
          reasonForAccess: item.reason || null,
        })),
      }

      await accessRequestService.create(payload)

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

  // Build out an explicit bound state matching your custom dropdown component expectations
  const activeSelectedHod: SelectedHod | null = value.hodId ? {
    userId: 0,
    employeeId: value.hodId,
    hodName: value.hodName || "",
    email: ""
  } : null

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

          {/* 
            Pass option items downward into UserSection.
            Inside UserSection, replace your base list fetch with this local `options` array if present.
          */}
          <UserSection
            value={value}
            onChange={updateValue}
            hodOptions={hodOptions}
            selectedHod={activeSelectedHod}
            onHodChange={handleHodOptionSelected}
          />

          <AccessDetailsSection
            items={requestItems}
            onItemsChange={setRequestItems}
            onFolderPathSelected={handleFolderPathSelected}
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
