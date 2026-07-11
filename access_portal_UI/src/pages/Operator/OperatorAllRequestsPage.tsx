import { operatorCartApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const OperatorAllRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={(async (factoryArg?: any) => {
        const page = typeof factoryArg === "number" ? factoryArg : 1;

        const result = await operatorCartApi.getCart({
          page: page,
          pageSize: 20
        })
        return result;
      }) as any}
      actionButtonLabel="View"
      actionButtonRoutePrefix="/request"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 150 },
        { headerName: "Department Name", field: "departmentName", width: 150 },
      ]}
    />
  )
}
