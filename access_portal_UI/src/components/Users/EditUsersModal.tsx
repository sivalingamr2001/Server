import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" // Ensure you have this shadcn primitive
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"

export const UserRole = {
  Admin: "Admin",
  Operator: "Operator",
  Hod: "Hod",
  User: "User",
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

// 1. Updated form values to accept an array of strings for roles
interface FormValues {
  roles: string[] 
  location: string
}

interface EditUsersModalProps {
  isOpen: boolean
  onClose: () => void
  userData: any | null
  onSave: (updatedData: { roles: string[]; location: string }) => void 
}

export const EditUsersModal = ({
  isOpen,
  onClose,
  userData,
  onSave,
}: EditUsersModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {
      roles: [],
      location: "",
    },
  })

  // 3. Parses existing roles from the DB into an array when modal opens
  useEffect(() => {
    if (isOpen && userData?.user) {
      let initialRoles: string[] = []
      const rawRoleData = userData.user.role

      if (rawRoleData) {
        try {
          // If stored as JSON string '["Admin","Hod"]'
          initialRoles = JSON.parse(rawRoleData)
        } catch {
          // Fallback if stored as comma-separated 'Admin,Hod'
          initialRoles = rawRoleData.split(",").map((r: string) => r.trim())
        }
      }

      reset({
        roles: Array.isArray(initialRoles) ? initialRoles : [],
        location: userData.user.location || "",
      })
    } else if (!isOpen) {
      reset({ roles: [], location: "" })
    }
  }, [userData, isOpen, reset])

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] w-[30vw]! max-w-5xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl text-primary">Edit User</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">
              {userData?.cmplUser?.cmplUserName || "Employee"}
            </span>{" "}
            ({userData?.cmplUser?.mailId || "No email"}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="space-y-5 py-2">
          <div className="grid grid-cols-1 gap-5 rounded-md border border-border bg-card p-4">
            
            {/* 4. Multi-Select Role Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Assigned Roles
              </label>
              <Controller
                control={control}
                name="roles"
                rules={{ required: "Please select at least one role" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        {field.value.length > 0
                          ? field.value.join(", ")
                          : "Select functional roles"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                      <div className="space-y-2">
                        {Object.values(UserRole).map((role) => {
                          const checked = field.value.includes(role)
                          return (
                            <div key={role} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-sm">
                              <Checkbox
                                id={`role-${role}`}
                                checked={checked}
                                onCheckedChange={(isSelected) => {
                                  if (isSelected) {
                                    field.onChange([...field.value, role])
                                  } else {
                                    field.onChange(field.value.filter((r) => r !== role))
                                  }
                                }}
                              />
                              <label
                                htmlFor={`role-${role}`}
                                className="text-sm font-medium leading-none cursor-pointer w-full py-1"
                              >
                                {role}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.roles && (
                <p className="text-xs text-destructive">
                  {errors.roles.message}
                </p>
              )}
            </div>

            {/* Location Input Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Work Location
              </label>
              <Input
                type="text"
                placeholder="Enter workspace location or branch"
                {...register("location", {
                  required: "Please enter an office location",
                })}
              />
              {errors.location && (
                <p className="text-xs text-destructive">
                  {errors.location.message}
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
