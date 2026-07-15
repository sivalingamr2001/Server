export const AccessItemStatus = {
  Submitted: 0,
  HodApproved: 1,
  HodRejected: 2,
  OperatorApproved: 3,
  OperatorRejected: 4,
  AccessGranted: 5,
  AccessDenied: 6,
  AccessExpired: 7,
  AccessRevoked: 8
} as const;
export type AccessItemStatus = typeof AccessItemStatus[keyof typeof AccessItemStatus];

export const AccessType = {
  NotApplicable: 0,
  ReadOnly: 1,
  ReadAndWrite: 2
} as const;
export type AccessType = typeof AccessType[keyof typeof AccessType];

export const ActiveState = {
  Inactive: 0,
  Active: 1
} as const;
export type ActiveState = typeof ActiveState[keyof typeof ActiveState];

export const AgreementState = {
  NotAgreed: 0,
  Agreed: 1
} as const;
export type AgreementState = typeof AgreementState[keyof typeof AgreementState];

// ─── DTOs & Responses ───────────────────────────────────

export interface CreateAccessRequestDto {
  requesterId: string;
  requestedTo: string;
  itsrNo?: string | null;
}

export interface CreateAccessItemDto {
  ticketNo?: string | null;
  folderPath: string;
  accessType: AccessType;
  reasonForAccess?: string | null;
}

export interface CreateAccessRequestWithItemsDto {
  request: CreateAccessRequestDto;
  items: CreateAccessItemDto[];
}

export interface UpdateAccessItemDto {
  accessItemId: number;
  folderPath?: string | null;
  accessType?: AccessType | null;
  confirmAccessType?: AccessType | null;
  reasonForAccess?: string | null;
}

export interface HodApproveOrRejectDto {
  accessItemId: number;
  status: AccessItemStatus;
  folderPath?: string | null;
  confirmAccessType?: AccessType | null;
  comments?: string | null;
}

export interface OperatorApproveOrRejectDto {
  accessItemId: number;
  status: AccessItemStatus;
  operatorApproverId: string;
  comments?: string | null;
}

export interface AccessRequestRenewalDto {
  accessItemId: number;
  accessType: AccessType;
  confirmAccessType?: AccessType | null;
}

export interface AccessRequestRevokeDto {
  accessItemId: number;
}

export interface DeleteAccessItemDto {
  accessItemId: number;
  modifiedBy: string;
}

export interface AccessRequestFilterDto {
  requesterId?: string | null;
  requestedTo?: string | null;
  status?: AccessItemStatus | null;
  accessType?: AccessType | null;
}

export interface AccessItemResponse {
  id: number;
  accessRequestId: number;
  ticketNo: string;
  status: AccessItemStatus;
  folderPath: string;
  accessType: AccessType;
  confirmAccessType: AccessType | null;
  reasonForAccess: string | null;
  comments: string | null;
  operatorApproverId: string | null;
  operatorApproverName: string | null;
  operatorApproverEmail: string | null;
  createdOn: string;
  modifiedOn: string | null;
}

export interface AccessRequestResponse {
  id: number;
  requesterId: string;
  requesterName: string | null;
  requesterEmail: string | null;
  requestedTo: string;
  requestedToName: string | null;
  requestedToEmail: string | null;
  isAgreed: AgreementState;
  itsrNo: string | null;
  createdOn: string;
  modifiedOn: string | null;
  isActive: ActiveState;
  items: AccessItemResponse[];
}

export interface PagedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UserProfileInfo {
  name: string;
  email: string;
}

export interface HodConfigurationDto {
  PrimaryHodId?: string | null;
  SecondaryHodId?: string | null;
}

export interface DashboardMetrics {
  totalAccessItems: number;
  activeItems: number;
  inactiveItems: number;
  status_Submitted: number;
  status_HodApproved: number;
  status_HodRejected: number;
  status_OperatorApproved: number;
  status_OperatorRejected: number;
  status_AccessGranted: number;
  status_AccessDenied: number;
  status_AccessExpired: number;
  status_AccessRevoked: number;
  type_NotApplicable: number;
  type_ReadOnly: number;
  type_ReadAndWrite: number;
  totalPendingAction: number;
}

import type { AxiosRequestConfig } from 'axios';
import axiosClient from './axiosClient';


export const accessRequestService = {
  /**
   * Fetch real-time aggregated metrics for the dashboard views
   */
  getDashboardMetrics: async (
    config?: AxiosRequestConfig
  ): Promise<DashboardMetrics> => { // Fixed wrapper syntax: returns the object directly
    const response = await axiosClient.get<DashboardMetrics>('/v1/AccessRequest/dashboard-metrics', config);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════

  /**
   * Create a new access request with associated items
   */
  create: async (
    dto: CreateAccessRequestWithItemsDto,
    config?: AxiosRequestConfig
  ): Promise<AccessRequestResponse> => {
    const response = await axiosClient.post<AccessRequestResponse>('/v1/AccessRequest', dto, config);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════
  // READ
  // ═══════════════════════════════════════════════════════

  /**
   * Get all active access requests and items submitted by a specific user ID
   */
  getAllByUserId: async (
    userId: string,
    config?: AxiosRequestConfig
  ): Promise<AccessRequestResponse[]> => {
    const encodedUserId = encodeURIComponent(userId);
    const response = await axiosClient.get<AccessRequestResponse[]>(`/v1/AccessRequest/user/${encodedUserId}`, config);
    return response.data;
  },

  /**
   * Get all pending or config-matched access requests for a specific HOD
   */
  getByHod: async (
    hodUserId: string,
    config?: AxiosRequestConfig
  ): Promise<AccessRequestResponse[]> => {
    const encodedHodUserId = encodeURIComponent(hodUserId);
    const response = await axiosClient.get<AccessRequestResponse[]>(`/v1/AccessRequest/hod/${encodedHodUserId}`, config);
    return response.data;
  },

  /**
   * Get all active access request items inside the IT Operator fulfillment queue
   */
  getOperatorQueue: async (
    config?: AxiosRequestConfig
  ): Promise<AccessRequestResponse[]> => {
    const response = await axiosClient.get<AccessRequestResponse[]>('/v1/AccessRequest/operator', config);
    return response.data;
  },

  /**
   * Get a single access request by ID with all items
   */
  getById: async (
    id: number,
    config?: AxiosRequestConfig
  ): Promise<AccessRequestResponse> => {
    const response = await axiosClient.get<AccessRequestResponse>(`/v1/AccessRequest/${id}`, config);
    return response.data;
  },

  /**
   * Get the complete access request details and all related sibling items by a single Item ID
   */
  getByItemId: async (
    id: number,
    config?: AxiosRequestConfig
  ): Promise<AccessRequestResponse> => {
    const response = await axiosClient.get<AccessRequestResponse>(`/v1/AccessRequest/item/${id}`, config);
    return response.data;
  },

  /**
   * Get items for a specific access request
   */
  getItemsByRequestId: async (
    requestId: number,
    config?: AxiosRequestConfig
  ): Promise<AccessItemResponse[]> => {
    const response = await axiosClient.get<AccessItemResponse[]>(`/v1/AccessRequest/${requestId}/items`, config);
    return response.data;
  },

  /**
   * Get the HOD's user ID based on a given folder path
   * public record HodConfigurationDto(string? PrimaryHodId, string? SecondaryHodId);
   * @param folderPath 
   */
  getHodIdByFolderPath: async (
    folderPath: string,
    config?: AxiosRequestConfig
  ): Promise<HodConfigurationDto> => {
    const encodedFolderPath = encodeURIComponent(folderPath);
    const response = await axiosClient.get<HodConfigurationDto>(`/v1/AccessRequest/get-hodby-folderpath?folderPath=${encodedFolderPath}`, config);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════
  // UPDATE (Workflow Operations)
  // ═══════════════════════════════════════════════════════

  /**
   * Update an access item's details (before approval)
   */
  updateItem: async (
    itemId: number,
    dto: UpdateAccessItemDto,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.put<void>(`/v1/AccessRequest/items/${itemId}`, dto, config);
  },

  /**
   * HOD approves or rejects an access item
   */
  hodDecision: async (
    itemId: number,
    dto: HodApproveOrRejectDto,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.post<void>(`/v1/AccessRequest/items/${itemId}/hod-decision`, dto, config);
  },

  operatorDecision: async (
    itemId: number,
    dto: OperatorApproveOrRejectDto,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.post<void>(`/v1/AccessRequest/items/${itemId}/operator-decision`, dto, config);
  },

  /**
   * Renew an existing access request item
   * Note: Matches [HttpPost("items/{itemId:int}/renew")] typical convention
   */
  renew: async (
    itemId: number,
    dto: AccessRequestRenewalDto,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.post<void>(`/v1/AccessRequest/items/${itemId}/renew`, dto, config);
  },

  /**
   * Revoke active access on an item
   * Note: Matches [HttpPost("items/{itemId:int}/revoke")] typical convention
   */
  revoke: async (
    itemId: number,
    dto: AccessRequestRevokeDto,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    await axiosClient.post<void>(`/v1/AccessRequest/items/${itemId}/revoke`, dto, config);
  },

  /**
   * Soft delete a single access item
   * Note: Matches [HttpDelete("items/{itemId:int}")] typical convention
   */
  softDeleteItem: async (
    itemId: number,
    dto: DeleteAccessItemDto,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    // Passing the DTO (modifiedBy) in the config data wrapper for a DELETE request
    await axiosClient.delete<void>(`/v1/AccessRequest/items/${itemId}`, { ...config, data: dto });
  },

  /**
   * Soft delete an entire access request container and all its elements
   * Note: Matches [HttpDelete("{id:int}")] typical convention
   */
  softDeleteRequest: async (
    id: number,
    modifiedBy: string,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    // Passing string modifiedBy parameter via URL query parameters or request body context
    await axiosClient.delete<void>(`/v1/AccessRequest/${id}`, {
      ...config,
      params: { modifiedBy }
    });
  }
};
