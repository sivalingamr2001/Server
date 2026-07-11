import type { AxiosRequestConfig } from "axios"
import axiosClient from "./axiosClient"

export const logApi = {
  getLogs: async (
    dateTarget: string,
    config?: AxiosRequestConfig
  ): Promise<string> => {
    const response = await axiosClient.get<string>(`/logs/${encodeURIComponent(dateTarget)}`, config)
    return response.data
  },
}
