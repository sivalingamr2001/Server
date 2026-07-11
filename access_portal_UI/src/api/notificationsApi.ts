import type { AxiosRequestConfig } from "axios"
import axiosClient from "./axiosClient"
import type { NotificationDto } from "./types"

export const notificationsApi = {
  getNotifications: async (config?: AxiosRequestConfig): Promise<NotificationDto[]> => {
    const response = await axiosClient.get<NotificationDto[]>("/notifications", config)
    return response.data
  },
}
