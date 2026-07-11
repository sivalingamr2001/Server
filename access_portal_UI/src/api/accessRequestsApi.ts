import type { AxiosRequestConfig } from "axios"
import { accessRequestService, type AccessRequestResponse, type UpdateAccessItemDto } from "./accessRequestApi"

export const accessRequestsApi = {
  getRequestDetail: async (
    requestId: number,
    itemId?: number,
    config?: AxiosRequestConfig
  ): Promise<AccessRequestResponse> => {
    const request = await accessRequestService.getById(requestId, config)

    if (!itemId) {
      return request
    }

    const filteredItems = request.items.filter((item) => item.id === itemId)
    return filteredItems.length ? { ...request, items: filteredItems } : request
  },

  resubmitItem: async (
    itemId: number,
    payload: { reason?: string | null },
    config?: AxiosRequestConfig
  ): Promise<void> => {
    const dto: UpdateAccessItemDto = {
      accessItemId: itemId,
      reasonForAccess: payload.reason ?? null,
    }

    await accessRequestService.updateItem(itemId, dto, config)
  },
}
