import { accessRequestService } from "@/api/accessRequestApi"
import { useAuth } from "@/context/AuthContext"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const HodAllDepartmentRequestsPage = () => {
  const { currentUser } = useAuth()

  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const hodId = currentUser?.user?.id ? String(currentUser.user.id) : ""
        return await accessRequestService.getByHod(hodId)
      }}
      actionButtonLabel="View"
      actionButtonRoutePrefix="/request"
    />
  )
}
