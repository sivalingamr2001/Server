import { accessRequestService } from "@/api/accessRequestApi"
import type { RequestGridRow } from "@/types"
import { RequestsPageFactory } from "../common/RequestsPageFactory"
import { useAuth } from "@/context/AuthContext"

export const HodPendingRequestsPage = () => {
  const { currentUser } = useAuth()

  return (
    <RequestsPageFactory<RequestGridRow>
      fetchApiFn={async () => {
        const hodId = currentUser?.user?.id ? String(currentUser.user.id) : ""
        return await accessRequestService.getByHod(hodId)
      }}
      actionButtonLabel="Review"
      actionButtonRoutePrefix="/review"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 160 },
      ]}
    />
  )
}
