import { ArrowLeft, ChevronRight, Folder, HardDrive, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet"
import { Skeleton } from "../ui/skeleton"

export type FolderNode = {
  driveName: string
  name?: string
  children?: FolderNode[]
}

type FolderPathSheetProps = {
  loading: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderNode[]
  onSelect: (path: string) => void
}

type StackItem = {
  type: "drive" | "folder"
  node: FolderNode
}

// Skeleton item that mimics a folder row
function FolderSkeleton() {
  return (
    <div className="flex w-full items-center justify-between rounded-md border px-4 py-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
        <Skeleton className="h-4 w-32 rounded-sm" />
      </div>
      <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
    </div>
  )
}

export function FolderPathSheet({
  loading,
  open,
  onOpenChange,
  folders,
  onSelect,
}: FolderPathSheetProps) {
  const [stack, setStack] = useState<StackItem[]>([])
  const [search, setSearch] = useState("")

  const drives = useMemo(() => {
    const driveMap = new Map<string, FolderNode>()
    folders.forEach((f) => {
      if (!driveMap.has(f.driveName)) {
        driveMap.set(f.driveName, {
          driveName: f.driveName,
          name: f.driveName,
          children: folders.filter((x) => x.driveName === f.driveName),
        })
      }
    })
    return Array.from(driveMap.values())
  }, [folders])

  const currentItems = useMemo(() => {
    if (!stack.length) return drives.map((d) => ({ ...d, type: "drive" as const }))
    const last = stack[stack.length - 1]
    return (last.node.children ?? []).map((c) => ({ ...c, type: "folder" as const }))
  }, [drives, stack])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return currentItems
    return currentItems.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase())
    )
  }, [currentItems, search])

  const fullPath = useMemo(() => {
    if (!stack.length) return ""
    const drive = stack[0].node.driveName
    const names = stack.slice(1).map((s) => s.node.name)
    return [drive, ...names].join("\\")
  }, [stack])

  const handleItemClick = (item: FolderNode & { type: "drive" | "folder" }) => {
    if (item.children?.length) {
      setStack((prev) => [...prev, { type: item.type, node: item }])
      setSearch("")
      return
    }

    const selectedPath =
      stack.length === 0
        ? item.driveName
        : `${fullPath}\\${item.name}`

    onSelect(selectedPath)
    onOpenChange(false)
    setStack([])
    setSearch("")
  }

  const handleBack = () => {
    setStack((prev) => prev.slice(0, -1))
    setSearch("")
  }

  const handleSelectCurrent = () => {
    if (!stack.length) return
    onSelect(fullPath)
    onOpenChange(false)
    setStack([])
    setSearch("")
  }

  const handleClose = (value: boolean) => {
    onOpenChange(value)
    if (!value) {
      setStack([])
      setSearch("")
    }
  }

  const breadcrumb = useMemo(() => {
    if (!stack.length) return "Select Drive"
    return stack.map((s) => s.node.name).join(" > ")
  }, [stack])

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-130 p-0 sm:max-w-130 flex flex-col">
        <SheetHeader className="border-b bg-muted/30 px-6 py-4 space-y-3 shrink-0">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
              Select Folder Path
            </SheetTitle>
            <p className="text-xs text-muted-foreground">{breadcrumb}</p>
          </div>

          {stack.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all shadow-sm transition-all animate-in fade-in-50 duration-200">
              <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="w-full select-all">{fullPath || stack[0].node.driveName}</span>
            </div>
          )}
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Toolbar */}
          <div className="space-y-3 border-b p-4 shrink-0">
            {stack.length > 0 && (
              <div className="flex justify-between items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack} disabled={loading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button variant="default" size="sm" onClick={handleSelectCurrent} disabled={loading}>
                  Select This Folder
                </Button>
              </div>
            )}

            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={stack.length === 0 ? "Search drives..." : "Search folders..."}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {loading ? (
              // Skeleton loading state - 6 items to fill viewport
              <div className="space-y-2">
                <FolderSkeleton />
                <FolderSkeleton />
                <FolderSkeleton />
                <FolderSkeleton />
                <FolderSkeleton />
                <FolderSkeleton />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {search.trim() ? "No matches found" : "No items"}
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={`${item.driveName}-${item.name}-${item.type}`}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition hover:bg-muted"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {item.type === "drive" ? (
                      <HardDrive className="h-4 w-4 shrink-0 text-blue-500" />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="truncate text-sm font-medium">{item.name}</span>
                  </div>

                  {!!item.children?.length && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}