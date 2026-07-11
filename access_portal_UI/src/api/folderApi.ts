export interface FolderDto {
  id: number;
  folderName: string;
  primaryHodId: string;
  secondaryHodId: string | null;
  createdBy: string;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string | null;
  isActive: boolean;
}

export interface FolderNode {
  name: string;
  driveName: string;
  children: Record<string, FolderNode>;
}

export interface FolderResponse {
  name: string;
  driveName: string;
  children: FolderResponse[];
}

export interface CreateFolderRequest {
  folderName: string;
  primaryHodId: string;
  secondaryHodId: string | null;
  createdBy: string;
}

export interface UpdateFolderRequest {
  id: number;
  folderName: string;
  primaryHodId: string;
  secondaryHodId: string | null;
  modifiedBy: string;
}

import type { AxiosRequestConfig } from 'axios';
import axiosClient from './axiosClient';

export const folderService = {
  // ═══════════════════════════════════════════════════════
  // READ
  // ═══════════════════════════════════════════════════════

  /**
   * Get all global tracking folder parameters
   */
  getAll: async (config?: AxiosRequestConfig): Promise<FolderDto[]> => {
    const response = await axiosClient.get<FolderDto[]>('/folder', config);
    return response.data;
  },

  /**
   * Get all folders assigned to a specific HOD
   */
  getByHod: async (hodId: string, config?: AxiosRequestConfig): Promise<FolderDto[]> => {
    const encodedHodId = encodeURIComponent(hodId);
    const response = await axiosClient.get<FolderDto[]>(`/folder/hod/${encodedHodId}`, config);
    return response.data;
  },

  /**
   * Retrieves a completely dynamic, multi-layered nested hierarchy folder tree omitting network server IPs
   */
  getStrictFolderHierarchy: async (config?: AxiosRequestConfig): Promise<FolderResponse[]> => {
    const response = await axiosClient.get<FolderResponse[]>('/folder/strict-hierarchy', config);
    return response.data;
  },

  /**
   * Retrieves a distinct, single-level array containing only the top-level parent folder groupings
   */
  getParentFolders: async (config?: AxiosRequestConfig): Promise<FolderResponse[]> => {
    const response = await axiosClient.get<FolderResponse[]>('/folder/parent-folders', config);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════
  // WRITE / ACTIONS
  // ═══════════════════════════════════════════════════════

  /**
   * Create a new tracking folder entry
   */
  create: async (request: CreateFolderRequest, config?: AxiosRequestConfig): Promise<number> => {
    const response = await axiosClient.post<number>('/folder', request, config);
    return response.data;
  },

  /**
   * Modify an existing folder's tracking details
   */
  update: async (request: UpdateFolderRequest, config?: AxiosRequestConfig): Promise<void> => {
    await axiosClient.put<void>('/folder', request, config);
  },

  /**
   * Soft delete a tracking entry marker by identification index
   */
  softDelete: async (id: number, modifiedBy: string, config?: AxiosRequestConfig): Promise<void> => {
    await axiosClient.delete<void>(`/folder/${id}`, {
      ...config,
      params: { modifiedBy }
    });
  }
};
