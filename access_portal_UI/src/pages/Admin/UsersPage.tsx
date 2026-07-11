import { usersApi } from "@/api"
import type { PortalUserDetails } from "@/api/types"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EditUsersModal } from "@/components/Users/EditUsersModal"
import type { DynamicPageConfig } from "@/types"
import { ChevronUp, TextQuote } from "lucide-react"
import { useMemo } from "react"
import { DynamicGridPage } from "../common/DynamicGridPage"

export const UsersPage = () => {
  const usersConfig = useMemo<DynamicPageConfig<PortalUserDetails>>(
    () => ({
      gridId: "compliance_users_v36",
      enableInfiniteScroll: true,
      defaultPageSize: 20,
      getId: (item) => item.user?.id || 0,

      fetchData: async (page, pageSize, search) => {
        return await usersApi.getPortalUsers({
          page,
          pageSize,
          search: search || undefined,
        })
      },

      onUpdateRecord: async (id, updatedData) => {
        await usersApi.updatePortalUser(id as number, {
          cmplUserId: id as number,
          role: [JSON.stringify(updatedData.roles)],
          location: updatedData.location,
        })
      },
      detailSectionsConfig: [
        { title: "Core User Profile Info", objectKey: "user" },
        { title: "Corporate Department Details", objectKey: "department" },
        { title: "Head of Department (HOD)", objectKey: "headOfDepartment" },
      ],
      columns: ({ openEditModal, toggleRowExpansion, expandedRowIds }) => [
        {
          headerName: "",
          width: 80,
          suppressMovable: true,
          filter: false,
          sortable: false,
          cellRenderer: (params: any) => {
            if (params.data?.__isDetailRow) return null
            const uId = params.data?.user?.id
            if (!uId || !toggleRowExpansion || !expandedRowIds) return null
            const isExpanded = expandedRowIds.includes(uId)
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                    onClick={() => toggleRowExpansion(uId)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <TextQuote className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isExpanded ? "Collapse Details" : "Expand Details"}
                </TooltipContent>
              </Tooltip>
            )
          },
        },
        { headerName: "User ID", field: "user.id" },
        { headerName: "Employee ID", field: "user.employeeId" },
        { headerName: "Username", field: "user.name" },
        { headerName: "Email Address", field: "user.email" },
        { headerName: "Location", field: "user.location" },
        { headerName: "Role", field: "user.role" },
        { headerName: "Department ID", field: "department.id" },
        { headerName: "Department Name", field: "department.name" },
        {
          headerName: "Actions",
          width: 100,
          cellRenderer: (params: any) =>
            params.data &&
            !params.data.__isDetailRow && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => openEditModal(params.data)}
              >
                Edit
              </Button>
            ),
        },
      ],
    }),
    []
  )

  return (
    <DynamicGridPage config={usersConfig} ModalComponent={EditUsersModal} />
  )
}
