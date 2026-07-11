import type { AxiosRequestConfig } from 'axios';
import axiosClient from './axiosClient';

export const UserRole = {
    Admin: "Admin",
    Operator: "Operator",
    Hod: "Hod",
    User: "User"
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface UserDto {
  userId: number;
  userName: string;
  empId: string | null;
  mailId: string | null;
  mobNo: number | null;
  deptId: number | null;
  role: string | null;
  location: string | null;
  createdOn: string;
  createdBy: string | null;
  modifiedBy: string | null;
  modifiedOn: string | null;
  isActive: number;
}
  
export interface UpdateUserRoleRequest {
  userId: string;
  role: UserRole;
  location: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  isAuthenticated: boolean;
  currentUser: UserDto;
  currentUserRole: string;
}

export const authService = {
  /**
   * Authenticates user credentials and returns user profile session info
   */
  login: async (
    dto: LoginRequest,
    config?: AxiosRequestConfig
  ): Promise<LoginResponse> => {
    const response = await axiosClient.post<LoginResponse>('/auth/login', dto, config);
    return response.data;
  }
};
