import type { AxiosRequestConfig } from "axios"
import axiosClient from "./axiosClient"
import type { FolderMappingDto, UpsertFolderMappingRequest } from "./types"

export const folderMappingsApi = {
  getFolderMappings: async (
    config?: AxiosRequestConfig
  ): Promise<{ data: FolderMappingDto[] }> => {
    const response = await axiosClient.get<FolderMappingDto[]>("/folder/mappings", config)
    return { data: response.data }
  },

  getParentFolders: async (
    config?: AxiosRequestConfig
  ): Promise<Array<{ name: string; driveName?: string; children?: unknown[] }>> => {
    const response = await axiosClient.get<Array<{ name: string; driveName?: string; children?: unknown[] }>>(
      "/folder/parent-folders",
      config
    )
    return response.data
  },

  updateFolderMapping: async (
    id: number | string,
    payload: UpsertFolderMappingRequest,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.put<void>(`/folder/mappings/${id}`, payload, config)
  },

  createFolderMapping: async (
    payload: UpsertFolderMappingRequest,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.post<void>("/folder/mappings", payload, config)
  },
}
