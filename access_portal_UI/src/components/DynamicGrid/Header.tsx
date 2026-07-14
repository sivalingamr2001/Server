import { RefreshCcw } from "lucide-react"
import React from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import type { GridActionButton } from "./types"

interface HeaderProps {
    title: string
    description?: string
    hasSearch: boolean
    searchPlaceholder?: string
    searchValue: string
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    hasRefresh: boolean
    onRefreshClick: () => void
    actionButtons?: GridActionButton[]
    isLoading?: boolean
}

export const Header: React.FC<HeaderProps> = ({
    title,
    description,
    hasSearch,
    searchPlaceholder = "Search...",
    searchValue,
    onSearchChange,
    hasRefresh,
    onRefreshClick,
    actionButtons = [],
    isLoading = false,
}) => {
    return (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>

            <div className="flex flex-col items-center gap-3">
                <div>
                    {hasSearch && (
                        <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={onSearchChange}
                            className="w-84 rounded-xs border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                        />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {actionButtons.map((btn) => {
                        const Icon = btn.icon
                        return (
                            <Button
                                size="xs"
                                key={btn.label}
                                type="button"
                                onClick={btn.onClick}
                                disabled={btn.isDisabled}
                                variant="secondary"
                                className="border border-border"
                            >
                                {Icon && <Icon className="mr-1 size-4" />}
                                {btn.label}
                            </Button>
                        )
                    })}

                    {hasRefresh && (
                        <Button
                            size="xs"
                            type="button"
                            onClick={onRefreshClick}
                            variant="default"
                        >
                            <RefreshCcw
                                className={`mr-1 size-4 ${isLoading ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
