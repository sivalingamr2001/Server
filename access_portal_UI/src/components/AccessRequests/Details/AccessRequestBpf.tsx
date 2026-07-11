import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AccessItemStatus, AccessItemStatus as AccessItemStatusType } from "@/api"

interface BpfProgressProps {
  status: AccessItemStatusType
  rejectedBy?: string | null
  rejectionReason?: string | null
}

const steps = [
  { key: "Submitted", label: "Submitted" },
  { key: "HOD", label: "HOD Review" },
  { key: "IT", label: "IT Review" },
  { key: "Granted", label: "Access Granted" },
]

export function AccessRequestBpf({
  status,
  rejectedBy,
  rejectionReason,
}: BpfProgressProps) {
  const currentStep = (() => {
    switch (status) {
      case AccessItemStatus.Submitted:
        return 1

      case AccessItemStatus.HodApproved:
        return 3

      case AccessItemStatus.OperatorApproved:
      case AccessItemStatus.AccessGranted:
      case AccessItemStatus.AccessExpired:
      case AccessItemStatus.AccessRevoked:
        return 4

      default:
        return 1
    }
  })()

  const isRejected =
    status === AccessItemStatus.HodRejected ||
    status === AccessItemStatus.OperatorRejected

  const progress = Math.min(Math.max(currentStep, 1), 4) * 25;

  return (
    <div className="shrink-0 rounded-2xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
            Current Status
          </p>
        </div>

        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            isRejected
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          {status}
        </span>
      </div>

      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-4 left-0 h-1 w-full rounded-full bg-slate-200" />

        {/* Progress Line */}
        <div
          className={cn(
            "absolute top-4 left-0 h-1 rounded-full transition-all",
            isRejected ? "bg-red-500" : "bg-emerald-500"
          )}
          style={{ width: `${progress}%` }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const stepNo = index + 1

            const completed = stepNo < currentStep
            const current = stepNo === currentStep

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-sm",
                    completed && "border-emerald-500 bg-emerald-500 text-white",
                    current && "border-primary text-primary",
                    !completed && !current && "border-slate-300 text-slate-400"
                  )}
                >
                  {completed ? (
                    <Check size={18} />
                  ) : current ? (
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  ) : (
                    stepNo
                  )}
                </div>

                <p className="mt-2 text-xs font-semibold">{step.label}</p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {completed
                    ? "Completed"
                    : current
                      ? "In Progress"
                      : "Pending"}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {(status === AccessItemStatus.HodRejected ||
        status === AccessItemStatus.OperatorRejected) && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <div className="font-semibold">Rejected by {rejectedBy || "the approver"}</div>
            {rejectionReason ? (
              <div className="mt-1 text-red-700/90">Reason: {rejectionReason}</div>
            ) : (
              <div className="mt-1 text-red-700/90">No rejection reason was provided.</div>
            )}
          </div>
        )}

      {status === AccessItemStatus.AccessRevoked && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 m-2 text-xs">
          Access has been revoked. {/* Need to add revoke reason here when API supports it */}
        </div>
      )}

      {status === AccessItemStatus.AccessExpired && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-2 text-xs text-orange-700">
          Access has expired.
        </div>
      )}
    </div>
  )
}
