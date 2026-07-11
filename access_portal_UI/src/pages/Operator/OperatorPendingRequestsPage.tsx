import { accessRequestService } from "@/api/accessRequestApi"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const OperatorPendingRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await accessRequestService.getOperatorQueue()
        return result
      }}
      actionButtonLabel="Process"
      actionButtonRoutePrefix="/process"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 150 },
      ]}
    />
  )
}
