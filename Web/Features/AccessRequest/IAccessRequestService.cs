using Server.Common;
using Server.Features.Users;

namespace Server.Features.AccessRequest;

public interface IAccessRequestService
{
    Task<AccessDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken ct);

    Task<Result<AccessRequestResponse>> CreateAsync(
        CreateAccessRequestWithItemsDto dto,
        CancellationToken ct = default);

    Task<Result<List<AccessRequestResponse>>> GetAllRequestsByUserIdAsync(
        string userId,
        CancellationToken ct = default);

    Task<Result<List<AccessRequestResponse>>> GetRequestsByHodAsync(
        string hodUserId,
        CancellationToken ct = default);

    Task<Result<List<AccessRequestResponse>>> GetRequestsByOperatorAsync(
        CancellationToken ct = default);

    Task<Result<AccessRequestResponse>> GetByIdAsync(
        int id,
        CancellationToken ct = default);

    Task<Result<AccessRequestResponse>> GetByItemIdAsync(
    int itemId,
    CancellationToken ct = default);

    Task<Result<IReadOnlyList<AccessItemResponse>>> GetItemsByRequestIdAsync(
        int requestId,
        CancellationToken ct = default);

    Task<Result<(UserDto? PrimaryHod, UserDto? SecondaryHod)>> GetHodByFolderPathAsync(
            string folderPath,
            CancellationToken ct = default);

    Task<Result> UpdateItemAsync(
        UpdateAccessItemDto dto,
        CancellationToken ct = default);

    Task<Result> HodDecisionAsync(
        HodApproveOrRejectDto dto,
        string modifiedBy,
        CancellationToken ct = default);

    Task<Result> OperatorDecisionAsync(
        OperatorApproveOrRejectDto dto,
        string modifiedBy,
        CancellationToken ct = default);

    Task<Result> RenewAsync(
        AccessRequestRenewalDto dto,
        string modifiedBy,
        CancellationToken ct = default);

    Task<Result> RevokeAsync(
        AccessRequestRevokeDto dto,
        string modifiedBy,
        CancellationToken ct = default);

    Task<Result> SoftDeleteItemAsync(
        DeleteAccessItemDto dto,
        CancellationToken ct = default);

    Task<Result> SoftDeleteRequestAsync(
        int id,
        string modifiedBy,
        CancellationToken ct = default);
}