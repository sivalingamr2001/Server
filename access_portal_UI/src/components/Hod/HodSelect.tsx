import { userService } from "@/api"
import { Input } from "@/components/ui/input"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useEffect, useState } from "react"

export interface SelectedHod {
    employeeId: string 
    email: string      
    hodName: string    
}

interface HodSelectProps {
    value?: SelectedHod | null
    onChange: (hod: SelectedHod) => void
    placeholder?: string
}

export const HodSelect = ({
    value,
    onChange,
    placeholder = "Search and select HOD...",
}: HodSelectProps) => {
    // Structural helper tool formatting text elements cleanly as requested
    const getDisplayString = (empId?: string, name?: string) => {
        if (!empId && !name) return ""
        if (!empId) return name || ""
        if (!name) return empId
        return `${empId} - ${name}`
    }

    const [search, setSearch] = useState(
        value ? getDisplayString(value.employeeId, value.hodName) : ""
    )
    const [openDropdown, setOpenDropdown] = useState(false)

    const {
        rowData: hodList,
        page,
        totalPages,
        loading: loadingHods,
        loadData,
        loadMore,
    } = useInfiniteScroll({
        pageSize: 20,
        fetchRequest: () =>
            userService.getHodPortalProfiles(),
        onError: (error) => {
            console.error("Failed to fetch HOD list:", error)
        },
    })

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1)
        }, 300)

        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        const close = () => setOpenDropdown(false)
        document.addEventListener("click", close)
        return () => {
            document.removeEventListener("click", close)
        }
    }, [])

    // Preserves local formatting patterns when initial payloads lock in
    useEffect(() => {
        if (value) {
            setSearch(getDisplayString(value.employeeId, value.hodName))
        } else {
            setSearch("")
        }
    }, [value])

    const handleDropdownScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        const reachedBottom =
            target.scrollTop + target.clientHeight >= target.scrollHeight - 50

        if (!loadingHods && page < totalPages && reachedBottom) {
            await loadMore(page + 1)
        }
    }

    const handleSelect = (employeeId: string, email: string, hodName: string) => {
        onChange({
            employeeId: String(employeeId).trim(),
            email: String(email).trim(),
            hodName: hodName.trim(),
        })
        setSearch(getDisplayString(employeeId, hodName))
        setOpenDropdown(false)
    }

    const normalizedSearch = search.trim().toLowerCase()

    const filteredHodList = hodList.filter((hod: any) => {
        const empIdStr = String(hod.employeeId || hod.id || "").trim().toLowerCase()
        const nameStr = String(hod.hodName || hod.name || "").trim().toLowerCase()
        const emailStr = String(hod.emailId || hod.email || "").trim().toLowerCase()

        if (!normalizedSearch) return true

        const currentCompound = getDisplayString(value?.employeeId, value?.hodName).toLowerCase()
        if (value && currentCompound === normalizedSearch) return true

        return [empIdStr, nameStr, emailStr].some(val =>
            val.includes(normalizedSearch)
        )
    })

    return (
        <div className="relative">
            <Input
                placeholder={placeholder}
                value={search}
                onClick={(e) => {
                    e.stopPropagation()
                    setOpenDropdown(true)
                }}
                onChange={(e) => {
                    setSearch(e.target.value)
                    setOpenDropdown(true)
                }}
            />

            {openDropdown && (
                <div
                    className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-md"
                    onClick={(e) => e.stopPropagation()}
                    onScroll={handleDropdownScroll}
                >
                    {filteredHodList.length === 0 && !loadingHods && (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                            No matching HOD records found
                        </div>
                    )}

                    {filteredHodList.map((hod: any) => {
                        const currentEmpId = String(hod.employeeId || hod.id || "")
                        const currentEmail = String(hod.emailId || hod.email || "")
                        const displayName = String(hod.hodName || hod.name || "N/A")

                        const isNoEmail =
                            !currentEmail || currentEmail.trim().toLowerCase() === "no email"

                        const isSelected =
                            value?.employeeId?.toLowerCase() === currentEmpId.toLowerCase()

                        return (
                            <button
                                type="button"
                                key={`${currentEmpId}-${currentEmail}`}
                                className={`w-full px-3 py-2 text-left hover:bg-accent text-sm ${
                                    isSelected ? "bg-accent font-medium text-accent-foreground" : ""
                                }`}
                                onClick={() => handleSelect(currentEmpId, currentEmail, displayName)}
                            >
                                <div className="font-medium">
                                    {currentEmpId} - {displayName}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    <span className={isNoEmail ? "text-destructive" : ""}>
                                        Email: {currentEmail ? currentEmail : "No Email"}
                                    </span>
                                </div>
                            </button>
                        )
                    })}

                    {loadingHods && (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                            Loading more records...
                        </div>
                    )}

                    {!loadingHods && page >= totalPages && hodList.length > 0 && (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                            End of results
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
