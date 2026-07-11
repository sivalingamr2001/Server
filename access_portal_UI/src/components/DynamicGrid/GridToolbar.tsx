import { memo } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import type { GridToolbarProps } from "./types"

export const GridToolbar = memo(
  ({
    title,
    description = "",
    state,
    showSearch,
    showRefresh,
    showClearFilters,
    onQuickFilterChange,
    onSearchChange,
    onRefresh,
    onClearFilters,
    customActions = [],
    gridApi,
  }: GridToolbarProps) => {
    return (
      <div className="flex flex-col gap-4 pb-2">
        {/* Top Row: Title and Description */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl leading-6 font-semibold">{title}</h1>
          {description && <span className="text-xs">{description}</span>}
        </div>

        {/* Bottom Row: Left Search, Right Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Side: Search Bar */}
          <div className="w-full sm:max-w-xs">
            {showSearch && (
              <Input
                type="text"
                value={state.quickFilter}
                placeholder="Quick search..."
                className="h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none"
                onChange={(e) => {
                  const nextValue = e.target.value
                  onQuickFilterChange(nextValue)
                  onSearchChange?.(nextValue)
                }}
              />
            )}
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {showClearFilters && state.activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={onClearFilters}
                className="h-9 px-3 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Clear Filters ({state.activeFiltersCount})
              </Button>
            )}

            {customActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "default"}
                onClick={() => action.onClick(gridApi)}
                size="sm"
                className="rounded-[6px]"
              >
                {action.icon && (
                  <span className="mr-1.5 flex items-center">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </Button>
            ))}

            {showRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={state.isRefreshing}
                size="sm"
                className="rounded-[6px]"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
)

GridToolbar.displayName = "GridToolbar"
