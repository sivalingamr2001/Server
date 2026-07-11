import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ReactNode } from "react"
import { HodSelect, type SelectedHod } from "../Hod/HodSelect"

// Added hodId to keep employee tracking and HOD tracking separated
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
  // Relaxed type configuration slightly to handle the custom hodId key injection safely
  onChange: (field: keyof UserSectionValue | "hodId", value: string | number) => void
}

export function UserSection({ value, onChange }: UserSectionProps) {
  // Construct structural value for HodSelect without using Employee Profile properties
  const currentHodValue: SelectedHod | null = value.hodName
    ? {
        employeeId: value.hodId || "",
        email: "", // Keep empty since email isn't cross-contaminating employee profile state
        hodName: value.hodName,
      }
    : null

  const handleHodChange = (selectedHod: SelectedHod) => {
    // Only update HOD data blocks without touching user profile states
    onChange("hodName", selectedHod.hodName)
    onChange("hodId", selectedHod.employeeId)
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Employee Information</h3>

      <div className="grid gap-4 md:grid-cols-3">
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
          />
        </Field>

        <Field label="Department">
          <Input readOnly value={value.departmentName ?? ""} />
        </Field>

        <Field label="Department HOD">
          <HodSelect 
            value={currentHodValue} 
            onChange={handleHodChange} 
          />
        </Field>

        <Field label="ITSR Number">
          <Input 
            value={value.itsrNumber ?? ""} 
            onChange={(e) => onChange("itsrNumber", e.target.value)}
          />
        </Field>
      </div>
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
