import { accessRequestService } from "@/api/accessRequestApi"
import { useAuth } from "@/context/AuthContext"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const MyRequestsPage = () => {
  const { currentUser } = useAuth()

  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const userId = currentUser?.user?.id ? String(currentUser.user.id) : ""
        return await accessRequestService.getAllByUserId(userId)
      }}
      actionButtonLabel="Edit"
      actionButtonRoutePrefix="/request"
      showCreateButton={true}
    />
  )
}
