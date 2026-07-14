import accessManagementApi from "@/api/accessManagementApi"
import { Input } from "@/components/ui/input"
import { useEffect, useState, useMemo } from "react"

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
  const [hodList, setHodList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Fetch all HOD records once on initial component layout load
  useEffect(() => {
    const fetchAllHods = async () => {
      setLoading(true)
      try {
        const data = await accessManagementApi.users.getAllHod()
        setHodList(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch HOD list:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllHods()
  }, [])

  // 2. Global event listener to automatically close dropdown on clicking outside
  useEffect(() => {
    const close = () => setOpenDropdown(false)
    document.addEventListener("click", close)
    return () => {
      document.removeEventListener("click", close)
    }
  }, [])

  // 3. Synchronize search text display value when external state changes
  useEffect(() => {
    if (value) {
      setSearch(getDisplayString(value.employeeId, value.hodName))
    } else {
      setSearch("")
    }
  }, [value])

  const handleSelect = (employeeId: string, email: string, hodName: string) => {
    onChange({
      employeeId: String(employeeId).trim(),
      email: String(email).trim(),
      hodName: hodName.trim(),
    })
    setSearch(getDisplayString(employeeId, hodName))
    setOpenDropdown(false)
  }

  // 4. Memory-cached local client-side filter computation
  const filteredHodList = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return hodList

    // Prevent search list from shrinking when matching the current selected option value
    const currentCompound = getDisplayString(value?.employeeId, value?.hodName).toLowerCase()
    if (value && currentCompound === normalizedSearch) return hodList

    return hodList.filter((hod: any) => {
      const empIdStr = String(hod.emP_ID || hod.cmpL_USER_ID || "").trim().toLowerCase()
      const nameStr = String(hod.cmpL_USER_NAME || "").trim().toLowerCase()
      const emailStr = String(hod.maiL_ID || "").trim().toLowerCase()

      return [empIdStr, nameStr, emailStr].some((val) =>
        val.includes(normalizedSearch)
      )
    })
  }, [search, hodList, value])

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
        >
          {loading && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Loading HOD records...
            </div>
          )}

          {!loading && filteredHodList.length === 0 && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No matching HOD records found
            </div>
          )}

          {!loading &&
            filteredHodList.map((hod: any) => {
              const currentEmpId = String(hod.emP_ID || hod.cmpL_USER_ID || "")
              const currentEmail = String(hod.maiL_ID || "")
              const displayName = String(hod.cmpL_USER_NAME || "N/A")

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
        </div>
      )}
    </div>
  )
}
