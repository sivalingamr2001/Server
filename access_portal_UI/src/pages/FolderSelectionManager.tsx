import type { FolderDto } from "@/api"
import { accessManagementApi } from "@/api/accessManagementApi"
import { FolderPathSheet } from "@/components/AccessRequest/folder-pathSheet"
import { useEffect, useState } from "react"

export default function FolderSelectionManager() {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [flatFolders, setFlatFolders] = useState<FolderDto[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isOpen) return

        const fetchFolders = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await accessManagementApi.folders.getFoldersHierarchy()
                setFlatFolders(data)
            } catch (err) {
                console.error("Failed to load audit folders:", err)
                setError("Could not load folder structures. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        fetchFolders()
    }, [isOpen])

    const handleFolderSelect = (selectedPath: string) => {
        console.log("Final Selected Path:", selectedPath)
    }

    return (
        <div className="p-6">
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded-md bg-primary px-4 py-2 text-white hover:opacity-90"
            >
                Browse Folders
            </button>

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            <FolderPathSheet
                open={isOpen}
                onOpenChange={setIsOpen}
                loading={loading}
                folders={flatFolders}
                onSelect={handleFolderSelect}
            />
        </div>
    )
}