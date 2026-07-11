import type { AxiosRequestConfig } from "axios"
import axiosClient from "./axiosClient"
import type { PortalUserDetails } from "./types"

export const usersApi = {
  getPortalUsers: async (
    config?: AxiosRequestConfig & {
      page?: number
      pageSize?: number
      search?: string
    }
  ): Promise<{
    data: PortalUserDetails[]
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }> => {
    const response = await axiosClient.get<PortalUserDetails[]>("/user/portal-users", config)
    return {
      data: response.data,
      page: config?.page ?? 1,
      pageSize: config?.pageSize ?? response.data.length,
      totalPages: 1,
      totalCount: response.data.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  },

  updatePortalUser: async (
    id: number,
    payload: unknown,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.put<void>(`/user/portal-users/${id}`, payload, config)
  },
}
