import { Checkbox } from "@/components/ui/checkbox"

type AgreementCheckboxProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function AgreementCheckbox({
  checked,
  onCheckedChange,
}: AgreementCheckboxProps) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-border bg-card p-4 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(!!next)}
      />
      <span>
        I agree that this access is for authorized business use and will be
        reviewed through the approval workflow.
      </span>
    </label>
  )
}
