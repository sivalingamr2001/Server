using Server.Features.Users;
using System.ComponentModel.DataAnnotations;

namespace Server.Features.AccessRequest;

// ─── Create ─────────────────────────────────────────────
public record CreateAccessRequestDto(
    [Required, StringLength(50)] string RequesterId,
    [Required, StringLength(50)] string RequestedTo,
    [StringLength(50)] string? ITSRNo = null
);

public record CreateAccessItemDto(
    [StringLength(100)] string? TicketNo,
    [Required, StringLength(500)] string FolderPath,
    AccessType AccessType,
    [StringLength(1000)] string? ReasonForAccess = null
);

public record CreateAccessRequestWithItemsDto(
    [Required] CreateAccessRequestDto Request,
    [Required, MinLength(1)] List<CreateAccessItemDto> Items
);

// ─── Update ─────────────────────────────────────────────
public record UpdateAccessItemDto(
    [Required] int AccessItemId,
    [StringLength(500)] string? FolderPath = null,
    AccessType? AccessType = null,
    AccessType? ConfirmAccessType = null,
    [StringLength(1000)] string? ReasonForAccess = null
);

// ─── HOD Approval ───────────────────────────────────────
public record HodApproveOrRejectDto(
    [Required] int AccessItemId,
    [Required] AccessItemStatus Status, // HodApproved or HodRejected
    [StringLength(500)] string? FolderPath = null,
    AccessType? ConfirmAccessType = null,
    [StringLength(2000)] string? Comments = null
);

// ─── Operator Approval ──────────────────────────────────
public record OperatorApproveOrRejectDto(
    [Required] int AccessItemId,
    [Required] AccessItemStatus Status, // OperatorApproved or OperatorRejected
    [Required, StringLength(50)] string OperatorApproverId,
    [StringLength(2000)] string? Comments = null
);

// ─── Renewal ────────────────────────────────────────────
public record AccessRequestRenewalDto(
    [Required] int AccessItemId,
    AccessType AccessType,
    AccessType? ConfirmAccessType = null
);

// ─── Revoke ─────────────────────────────────────────────
public record AccessRequestRevokeDto(
    [Required] int AccessItemId
);

// ─── Soft Delete ────────────────────────────────────────
public record DeleteAccessItemDto(
    [Required] int AccessItemId,
    [Required, StringLength(50)] string ModifiedBy
);

// ─── Query / Filter ─────────────────────────────────────
public record AccessRequestFilterDto(
    string? RequesterId = null,
    string? RequestedTo = null,
    AccessItemStatus? Status = null,
    AccessType? AccessType = null
);

// ─── Response ───────────────────────────────────────────
public record AccessItemResponse(
    int Id,
    int AccessRequestId,
    string TicketNo,
    AccessItemStatus Status,
    string FolderPath,
    AccessType AccessType,
    AccessType? ConfirmAccessType,
    string? ReasonForAccess,
    string? Comments,
    string? OperatorApproverId,
    string? OperatorApproverName,
    string? OperatorApproverEmail,
    DateTime CreatedOn,
    DateTime? ModifiedOn
);

public record AccessRequestResponse(
    int Id,
    string RequesterId,
    string? RequesterName,
    string? RequesterEmail,
    string RequestedTo,
    string? RequestedToName,
    string? RequestedToEmail,
    AgreementState IsAgreed,
    string? ITSRNo,
    DateTime CreatedOn,
    DateTime? ModifiedOn,
    ActiveState IsActive,
    IReadOnlyList<AccessItemResponse> Items
);

public record PagedResponse<T>(
    IReadOnlyList<T> Data,
    PaginationMeta Pagination
);

public record PaginationMeta(
    int Page,
    int PageSize,
    int TotalPages,
    int TotalCount,
    bool HasNext,
    bool HasPrevious
);

public class UserProfileInfo
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class AccessDashboardMetricsDto
{
    public int TotalAccessItems { get; set; }
    public int ActiveItems { get; set; }
    public int InactiveItems { get; set; }
    public int Status_Submitted { get; set; }
    public int Status_HodApproved { get; set; }
    public int Status_HodRejected { get; set; }
    public int Status_OperatorApproved { get; set; }
    public int Status_OperatorRejected { get; set; }
    public int Status_AccessGranted { get; set; }
    public int Status_AccessDenied { get; set; }
    public int Status_AccessExpired { get; set; }
    public int Status_AccessRevoked { get; set; }
    public int Type_NotApplicable { get; set; }
    public int Type_ReadOnly { get; set; }
    public int Type_ReadAndWrite { get; set; }
    public int TotalPendingAction { get; set; }
}

public record HodConfigurationDto(
    UserDto? PrimaryHod,
    UserDto? SecondaryHod
);
