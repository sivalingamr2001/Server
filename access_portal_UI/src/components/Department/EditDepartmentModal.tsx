import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { HodSelect } from "../Hod/HodSelect"

export interface UpdateDepartmentRequest {
  deptName?: string | null
  hodId?: string | null  
  email?: string | null  
}

interface EditDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  departmentData: any | null
  onSave: (payload: UpdateDepartmentRequest) => Promise<void>
}

export const EditDepartmentModal = ({
  isOpen,
  onClose,
  departmentData,
  onSave,
}: EditDepartmentModalProps) => {
  // 1. Local state to store and display the HOD Name independently of the ID
  const [selectedHodName, setSelectedHodName] = useState("")

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<UpdateDepartmentRequest>({
    defaultValues: {
      deptName: "",
      hodId: null,
      email: null,
    },
  })

  const currentEmail = watch("email")

  // 2. Synchronize initial values cleanly when modal opens
  useEffect(() => {
    if (isOpen && departmentData) {
      reset({
        deptName: departmentData.name || "",
        hodId: departmentData.hodId ? String(departmentData.hodId).trim() : null,
        email: departmentData.email ? String(departmentData.email).trim() : null,
      })
      
      // Look through all potential API naming schemas to extract the text name string
      setSelectedHodName(
        departmentData.hodName || 
        departmentData.assignedHodName || 
        departmentData.managerName || 
        ""
      )
    } else if (!isOpen) {
      reset({ deptName: "", hodId: null, email: null })
      setSelectedHodName("")
    }
  }, [departmentData, isOpen, reset])

  const onSubmit = async (data: UpdateDepartmentRequest) => {
    const payload: UpdateDepartmentRequest = {
      deptName: data.deptName?.trim() || null,
      hodId: data.hodId?.trim() || null,
      email: data.email?.trim() || null,
    }
    await onSave(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] w-[30vw]! max-w-5xl!">
        <DialogHeader>
          <DialogTitle className="text-3xl text-primary">
            Edit Department
          </DialogTitle>
          <DialogDescription>
            Update the department details for {""}
            <span className="font-semibold text-foreground">
              {departmentData?.name || departmentData?.id}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="grid grid-cols-1 gap-5 rounded-md border border-border bg-card p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Department Name
              </label>
              <Input
                type="text"
                placeholder="Enter department name"
                {...register("deptName", {
                  required: "Department name is required",
                })}
              />
              {errors.deptName && (
                <p className="text-xs text-destructive">
                  {errors.deptName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Assigned HOD
              </label>

              {departmentData ? (
                <Controller
                  control={control}
                  name="hodId"
                  rules={{
                    required: "Please select an HOD",
                    validate: (val) => (val && val.trim() !== "") || "Please select an HOD"
                  }}
                  render={({ field }) => (
                    <HodSelect
                      value={
                        field.value 
                          ? {
                            employeeId: field.value, 
                            email: currentEmail || departmentData.email || "",
                            // 3. Feeds local state to display name directly instead of the raw ID string
                            hodName: selectedHodName, 
                          }
                          : null
                      }
                      onChange={(hod) => {
                        field.onChange(hod.employeeId)
                        setValue("email", hod.email) 
                        
                        // 4. Instantly catch and update text state when an item is chosen from the list
                        setSelectedHodName(hod.hodName) 
                      }}
                    />
                  )}
                />
              ) : (
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              )}

              {errors.hodId && (
                <p className="text-xs text-destructive">
                  {errors.hodId.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
