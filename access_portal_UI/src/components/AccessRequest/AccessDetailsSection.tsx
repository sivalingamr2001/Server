import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, FolderOpen, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "../ui/button"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Textarea } from "../ui/textarea"
import { useAuth } from "@/context/AuthContext"
import { useLoader } from "@/hooks/useLoader"
import { FolderPathSheet } from "./folder-pathSheet"
import accessManagementApi from "@/api/accessManagementApi"

type FolderNode = {
  driveName: string
  name: string
  children?: FolderNode[]
}

export type RequestItem = {
  id: number
  accessType: string
  confirmAccessType?: string
  folderPath: string
  reason: string
}

type AccessDetailsSectionProps = {
  items?: RequestItem[]
  onItemsChange?: (items: RequestItem[]) => void
}

const requestTypes = [
  {
    value: "not-applicable",
    label: "Not Applicable",
  },
  {
    value: "read-only",
    label: "Read Only",
  },
  {
    value: "read-write",
    label: "Read & Write",
  },
]

function mapFolderNode(folder: any): FolderNode {
  const children = folder.Children ?? folder.children ?? []

  return {
    driveName: folder.DriveName ?? folder.driveName ?? "",
    name: folder.Name ?? folder.name ?? folder.path ?? "",
    children: children.map(mapFolderNode),
  }
}

function AccessDetailsSection({
  items: controlledItems,
  onItemsChange,
}: AccessDetailsSectionProps) {
  const [items, setItems] = useState<RequestItem[]>(() =>
    controlledItems && controlledItems.length > 0
      ? controlledItems
      : [
        {
          id: 1,
          accessType: "not-applicable",
          folderPath: "",
          reason: "",
        },
      ]
  )

  const { currentUserRole } = useAuth()
  const [folders, setFolders] = useState<FolderNode[]>([])

  const [expandedId, setExpandedId] = useState<number | null>(1)

  const [folderSheetOpen, setFolderSheetOpen] = useState(false)

  const [activeItemId, setActiveItemId] = useState<number | null>(null)

  const { loading, withLoader } = useLoader();

  useEffect(() => {
    if (controlledItems && controlledItems.length > 0) {
      setItems(controlledItems)
      if (controlledItems[0]?.id) setExpandedId(controlledItems[0].id)
      return
    }

    setItems([
      {
        id: 1,
        accessType: "not-applicable",
        folderPath: "",
        reason: "",
      },
    ])
  }, [controlledItems])

  useEffect(() => {
    let cancelled = false;

    const loadFolders = async () => {
      const result = await withLoader(() =>
        accessManagementApi.folders.getFoldersHierarchy()
      );

      if (cancelled || !result) return;

      setFolders(result.map(mapFolderNode));
    };

    loadFolders();

    return () => {
      cancelled = true;
    };
  }, [withLoader]);

  const updateItems = (nextItems: RequestItem[]) => {
    setItems(nextItems)
    onItemsChange?.(nextItems)
  }

  const addItem = () => {
    const nextId = Date.now()
    const nextItems = [
      ...items,
      {
        id: nextId,
        accessType: "not-applicable",
        folderPath: "",
        reason: "",
      },
    ]

    updateItems(nextItems)
    setExpandedId(nextId)
  }

  const removeItem = (id: number) => {
    const updated = items.filter((item) => item.id !== id)

    updateItems(updated)

    if (expandedId === id) {
      setExpandedId(updated[0]?.id ?? null)
    }
  }

  const updateItem = (id: number, field: keyof RequestItem, value: string) => {
    const nextItems = items.map((item) =>
      item.id === id
        ? {
          ...item,
          [field]: value,
        }
        : item
    )

    updateItems(nextItems)
  }

  const getAccessTypeLabel = (value: string) =>
    requestTypes.find((t) => t.value === value)?.label ?? "Not Applicable"

  return (
    <>
      <section className="space-y-4 rounded-md border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Request Details</h3>

          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto">
          {items.map((item, index) => {
            const expanded = expandedId === item.id

            return (
              <div key={item.id} className="rounded-md border">
                <div className="flex items-center justify-between p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    className="flex flex-1 items-center justify-between gap-4 text-left"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <p className="shrink-0 font-medium">
                        Access Item {index + 1}
                      </p>

                      {!expanded && (
                        <>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
                              item.accessType === "read-only" &&
                              "bg-blue-100 text-blue-700",
                              item.accessType === "read-write" &&
                              "bg-green-100 text-green-700",
                              item.accessType === "not-applicable" &&
                              "bg-slate-100 text-slate-700"
                            )}
                          >
                            {getAccessTypeLabel(item.accessType)}
                          </span>

                          <p
                            className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
                            title={item.folderPath}
                          >
                            {item.folderPath || "No folder selected"}
                          </p>
                        </>
                      )}
                    </div>

                    {expanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    )}
                  </button>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                {expanded && (
                  <div className="space-y-4 border-t p-4">
                    <div className="grid gap-4 md:grid-cols-20">
                      <div className="space-y-2 md:col-span-3">
                        <Label>Access Type</Label>

                        <Select
                          value={item.accessType}
                          onValueChange={(value) =>
                            updateItem(item.id, "accessType", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            {requestTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {currentUserRole === "hod" && (
                        <div className="space-y-2 md:col-span-3">
                          <Label>Confirm Access Type</Label>

                          <Select
                            value={item.confirmAccessType ?? ""}
                            onValueChange={(value) =>
                              updateItem(item.id, "confirmAccessType", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select access type" />
                            </SelectTrigger>

                            <SelectContent>
                              {requestTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div
                        className={cn(
                          "space-y-2",
                          currentUserRole === "hod"
                            ? "md:col-span-14"
                            : "md:col-span-17"
                        )}
                      >
                        <Label>Folder Path</Label>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between px-3 font-normal"
                          onClick={() => {
                            setActiveItemId(item.id)
                            setFolderSheetOpen(true)
                          }}
                        >
                          <span
                            className="flex-1 truncate text-left"
                            title={item.folderPath}
                          >
                            {item.folderPath || "Select folder path"}
                          </span>

                          <FolderOpen className="ml-3 h-4 w-4 shrink-0" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Reason for Access</Label>

                      <Textarea
                        value={item.reason}
                        onChange={(e) =>
                          updateItem(item.id, "reason", e.target.value)
                        }
                        placeholder="Please explain why access is required"
                        className="min-h-24 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <FolderPathSheet
        loading={loading}
        open={folderSheetOpen}
        onOpenChange={setFolderSheetOpen}
        folders={folders}
        onSelect={(path) => {
          if (!activeItemId) return

          updateItem(activeItemId, "folderPath", path)
        }}
      />
    </>
  )
}

export default AccessDetailsSection
