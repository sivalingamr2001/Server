import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { HodSelect, type SelectedHod } from "./HodSelect"

export type UserSectionValue = {
  userId: number
  employeeId: string
  name: string
  email?: string | null
  departmentName?: string | null
  hodName?: string | null
  itsrNumber?: string | null
  hodId?: string | null
}

type UserSectionProps = {
  value: UserSectionValue
  onChange: (field: keyof UserSectionValue, fieldValue: string | number | boolean) => void
  // Added properties to accept parsed data sets passed down from parent components
  hodOptions?: SelectedHod[]
}

export function UserSection({ value, onChange, hodOptions = [] }: UserSectionProps) {
  // Local state tracker to control workspace layout height expansion properties
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleHodChange = (selectedHod: SelectedHod) => {
    onChange("hodName", selectedHod.hodName)
    onChange("hodId", selectedHod.employeeId)
  }

  return (
    <section className="rounded-md border border-border bg-card p-4 transition-all duration-200">
      {/* Interactive header area allowing users to click and minimize data rows */}
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
        <h3 className="text-sm font-semibold">Employee Information</h3>
        <span className="text-muted-foreground hover:text-foreground">
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </span>
      </button>

      {/* Renders subfield structures conditionally depending on view states */}
      {!isCollapsed && (
        <div className="mt-4 grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <Field label="Employee ID">
            <Input
              value={value.employeeId}
              onChange={(e) => onChange("employeeId", e.target.value)}
              placeholder="Enter employee id"
            />
          </Field>

          <Field label="Email">
            <Input
              value={value.email ?? ""}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="Enter email"
            />
          </Field>

          <Field label="Employee Name">
            <Input
              value={value.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Enter employee name"
            />
          </Field>

          <Field label="Department">
            <Input readOnly value={value.departmentName ?? ""} />
          </Field>

          <Field label="Department HOD">
            <HodSelect
              /* 
                FIXED: Changed tracking fields from the base logged-in user profile
                to map explicitly to the selected HOD identifiers (`hodId`, `hodName`)
              */
              value={value.hodId ? {
                userId: 0, // Fallback safe mock ID structure 
                employeeId: value.hodId,
                hodName: value.hodName || value.hodId,
                email: ""
              } : null}
              onChange={handleHodChange}
              // Forwards the folder path matches down into the list selector rendering logic
              hodOptions={hodOptions}
            />
          </Field>

          <Field label="ITSR Number">
            <Input
              value={value.itsrNumber ?? ""}
              onChange={(e) => onChange("itsrNumber", e.target.value)}
              placeholder="Enter ITSR number"
            />
          </Field>
        </div>
      )}
    </section>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export const getAccessTypeLabel = (accessType: number): string => {
  const statuses: Record<number, string> = {
    1: 'Not Applicable',
    2: 'Read Only',
    3: 'Read and Write',
  };
  return statuses[accessType] || 'Unknown';
};
