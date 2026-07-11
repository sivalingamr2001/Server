import { memo } from "react"
import type { DetailSectionConfig } from "./types"

interface DynamicDetailCellRendererProps {
  data: Record<string, any>
  sections?: DetailSectionConfig[]
}

export const DynamicDetailCellRenderer = memo(
  ({ data, sections = [] }: DynamicDetailCellRendererProps) => {
    return (
      <div className="space-y-4 border-y bg-slate-50/60 p-5 text-sm select-text dark:bg-slate-900/40">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, idx) => {
            const subObject = data[section.objectKey]
            if (!subObject || typeof subObject !== "object") return null

            return (
              <div
                key={idx}
                className="space-y-2 border-r border-slate-200 pr-4 last:border-none dark:border-slate-800"
              >
                <h4 className="mb-2 text-xs font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                  {section.title}
                </h4>
                <div className="space-y-1.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                  {Object.entries(subObject).map(([key, value]) => {
                    if (section.hiddenFields?.includes(key)) return null

                    return (
                      <p
                        key={key}
                        className="truncate"
                        title={`${key}: ${String(value)}`}
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {key}:
                        </span>{" "}
                        {value !== null && value !== undefined ? (
                          String(value)
                        ) : (
                          <span className="text-slate-400">null</span>
                        )}
                      </p>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

DynamicDetailCellRenderer.displayName = "DynamicDetailCellRenderer"
