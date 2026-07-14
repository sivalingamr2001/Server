import type { AxiosRequestConfig } from 'axios';
import axiosClient from './axiosClient';
import type { UpdateUserRoleRequest, UserDto } from './authApi';

export const userService = {
    // ═══════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════

    /**
     * Get all user portal profiles with role and location info
     */
    getUserPortalProfiles: async (config?: AxiosRequestConfig): Promise<UserDto[]> => {
        const response = await axiosClient.get<UserDto[]>('/user/profiles', config);
        return response.data;
    },

    /**
     * Get all HOD portal profiles with role and location info
     */
    getHodPortalProfiles: async (config?: AxiosRequestConfig): Promise<UserDto[]> => {
        const response = await axiosClient.get<UserDto[]>('/user/hod-profiles', config);
        return response.data;
    },

    /**
     * Get a specific user portal profile with role and location info by User ID
     */
    getUserPortalProfileById: async (id: string, config?: AxiosRequestConfig): Promise<UserDto> => {
        const encodedId = encodeURIComponent(id);
        const response = await axiosClient.get<UserDto>(`/user/profiles/${encodedId}`, config);
        return response.data;
    },

    // ═══════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════

    /**
     * Update an existing user's role and location details
     */
    updateUserRole: async (request: UpdateUserRoleRequest, config?: AxiosRequestConfig): Promise<void> => {
        await axiosClient.put<void>('/user/role', request, config);
    }
};
