using Dapper;
using MySqlConnector;
using Server.Common;
using Server.Features.AccessRequest;
using Server.Features.DynamicQueryExecutor;
using System.Data;

namespace Server.Services;

/// <summary>
/// Access request management service using DynamicQueryExecutor for safe, 
/// parameterized MySQL operations with named connection support.
/// </summary>
public sealed class AccessRequestService(
    IConfiguration configuration,
    IDynamicQueryExecutor executor,
    ILogger<AccessRequestService> logger) : IAccessRequestService
{
    private readonly IDynamicQueryExecutor _executor = executor ?? throw new ArgumentNullException(nameof(executor));
    private readonly ILogger<AccessRequestService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private async Task<int> GetStartingSequenceAsync(CancellationToken ct)
    {
        int? nextSequence = await _executor.QuerySingleOrDefaultAsync<int>(
            AccessRequestQueries.GetNextSequenceForTicketNumber,
            cancellationToken: ct
        );

        if (!nextSequence.HasValue || nextSequence == 0)
        {
            throw new InvalidOperationException("Could not retrieve AUTO_INCREMENT. Ensure 'jan_access_requests' has an AUTO_INCREMENT primary key.");
        }

        return nextSequence.Value;
    }

    public async Task<AccessDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken ct)
    {
        var result = await _executor.QueryFirstOrDefaultAsync<AccessDashboardMetricsDto>(
            AccessRequestQueries.DashboardSummary,
            cancellationToken: ct);

        return result ?? new AccessDashboardMetricsDto();
    }

    // ═══════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════

    public async Task<Result<AccessRequestResponse>> CreateAsync(
        CreateAccessRequestWithItemsDto dto,
        CancellationToken ct = default)
    {
        if (dto?.Request is null)
            return Result<AccessRequestResponse>.Failure("Validation", "Request data is required.");

        if (dto.Items is null || dto.Items.Count == 0)
            return Result<AccessRequestResponse>.Failure("Validation", "At least one access item is required.");

        try
        {
            var requestId = await _executor.ExecuteInTransactionAsync<int>(
                async tx =>
                {
                    int currentSequence = await GetStartingSequenceAsync(ct);
                    var dateStr = DateTime.Today.ToString("yyyyMMdd");

                    var requestParams = new
                    {
                        dto.Request.RequesterId,
                        dto.Request.RequestedTo,
                        IsAgreed = (int)AgreementState.NotAgreed,
                        dto.Request.ITSRNo,
                        CreatedBy = dto.Request.RequesterId,
                        ModifiedBy = dto.Request.RequesterId,
                        IsActive = (int)ActiveState.Active
                    };

                    var id = await _executor.InsertAsync<int>(
                        AccessRequestQueries.InsertAccessRequest,
                        requestParams,
                        tx,
                        commandTimeout: 30,
                        cancellationToken: ct);

                    if (id <= 0)
                        throw new InvalidOperationException("Failed to insert AccessRequest.");

                    foreach (var item in dto.Items)
                    {
                        string ticketNo = $"REQ-{dateStr}-{currentSequence:D4}";
                        currentSequence++;

                        var itemParams = new
                        {
                            AccessRequestId = id,
                            TicketNo = ticketNo,
                            Status = (int)AccessItemStatus.Submitted,
                            item.FolderPath,
                            AccessType = (int)item.AccessType,
                            ConfirmAccessType = (int?)null,
                            item.ReasonForAccess,
                            CreatedBy = dto.Request.RequesterId,
                            ModifiedBy = dto.Request.RequesterId,
                            IsActive = (int)ActiveState.Active
                        };

                        var itemId = await _executor.InsertAsync<int>(
                            AccessRequestQueries.InsertAccessItem,
                            itemParams,
                            tx,
                            commandTimeout: 30,
                            cancellationToken: ct);

                        if (itemId <= 0)
                            throw new InvalidOperationException($"Failed to insert AccessItem for TicketNo: {ticketNo}");
                    }

                    return id;
                },
                IsolationLevel.ReadCommitted,
                commandTimeout: 60,
                cancellationToken: ct);

            var result = await GetByIdAsync(requestId, ct);
            return result.IsSuccess
                ? Result<AccessRequestResponse>.Success(result.Value!)
                : Result<AccessRequestResponse>.Failure("Database", "Created but failed to retrieve the request.");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business rule violation during access request creation.");
            return Result<AccessRequestResponse>.Failure("Validation", ex.Message);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Unexpected error creating access request.");
            return Result<AccessRequestResponse>.Failure("Internal", "Failed to create access request. Please try again.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════

    public async Task<Result<List<AccessRequestResponse>>> GetAllRequestsByUserIdAsync(
    string userId,
    CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return Result<List<AccessRequestResponse>>.Failure("Validation", "User ID is required.");

        const string requestsSql = @"
        SELECT 
            r.Id AS RequestId, r.RequesterId, r.RequestedTo, r.IsAgreed, r.ITSRNo, r.CreatedBy, r.CreatedOn, r.ModifiedOn, r.IsActive,
            i.Id AS ItemId, i.TicketNo, i.Status AS ItemStatus, i.FolderPath, i.AccessType, i.ConfirmAccessType, i.ReasonForAccess, i.Comments,
            i.OperatorApproverId, i.CreatedOn AS ItemCreatedOn, i.ModifiedOn AS ItemModifiedOn
        FROM dev.jan_access_requests r
        LEFT JOIN dev.jan_access_items i ON r.Id = i.AccessRequestId AND i.IsActive = 1
        WHERE r.RequesterId = @UserId 
          AND r.IsActive = 1;";

        try
        {
            var rows = (await _executor.QueryAsync<dynamic>(
                requestsSql,
                new { UserId = userId },
                commandTimeout: 30,
                cancellationToken: ct)).ToList();

            if (!rows.Any())
                return Result<List<AccessRequestResponse>>.Success(new List<AccessRequestResponse>());

            var uniqueUserIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var row in rows)
            {
                if (row.RequesterId != null) uniqueUserIds.Add((string)row.RequesterId);
                if (row.RequestedTo != null) uniqueUserIds.Add((string)row.RequestedTo);
                if (row.OperatorApproverId != null) uniqueUserIds.Add((string)row.OperatorApproverId);
            }

            var userProfileMap = new Dictionary<string, UserProfileInfo>(StringComparer.OrdinalIgnoreCase);

            if (uniqueUserIds.Any())
            {
                const string batchUserSql = @"
                SELECT 
                    emp_id AS EmpId,
                    MAX(NULLIF(TRIM(CMPL_USER_NAME), '')) AS UserName,
                    MAX(NULLIF(TRIM(MAIL_ID), '')) AS EmailId
                FROM itsr.itsr_users
                WHERE CMPL_USER_ID IN @UserIds OR emp_id IN @UserIds OR MAIL_ID IN @UserIds
                GROUP BY emp_id;";

                using (var MySQLConnection_CMPL = new MySqlConnection(configuration.GetConnectionString("MySQLConnection_CMPL")))
                {
                    var userRows = await MySQLConnection_CMPL.QueryAsync<dynamic>(batchUserSql, new { UserIds = uniqueUserIds.ToList() });
                    foreach (var uRow in userRows)
                    {
                        if (uRow.EmpId != null)
                        {
                            userProfileMap[(string)uRow.EmpId] = new UserProfileInfo
                            {
                                Name = (string)(uRow.UserName ?? string.Empty),
                                Email = (string)(uRow.EmailId ?? string.Empty)
                            };
                        }
                    }
                }
            }

            var trackingMap = new Dictionary<int, (dynamic RequestRow, List<AccessItemResponse> Items)>();

            foreach (var row in rows)
            {
                int requestId = row.RequestId;

                if (!trackingMap.TryGetValue(requestId, out var container))
                {
                    container = (row, new List<AccessItemResponse>());
                    trackingMap.Add(requestId, container);
                }

                if (row.ItemId != null)
                {
                    string? opName = null;
                    string? opEmail = null;

                    // Fix CS0165: Explicitly pre-assign out variable to clear strict compiler tracks
                    UserProfileInfo? opProfile = null;
                    if (row.OperatorApproverId != null && userProfileMap.TryGetValue((string)row.OperatorApproverId, out opProfile))
                    {
                        opName = opProfile.Name;
                        opEmail = opProfile.Email;
                    }

                    container.Items.Add(new AccessItemResponse(
                        Id: row.ItemId,
                        AccessRequestId: requestId,
                        TicketNo: row.TicketNo,
                        Status: (AccessItemStatus)row.ItemStatus,
                        FolderPath: row.FolderPath,
                        AccessType: (AccessType)row.AccessType,
                        ConfirmAccessType: row.ConfirmAccessType != null ? (AccessType?)row.ConfirmAccessType : null,
                        ReasonForAccess: row.ReasonForAccess,
                        Comments: row.Comments,
                        OperatorApproverId: row.OperatorApproverId,
                        OperatorApproverName: opName,
                        OperatorApproverEmail: opEmail,
                        CreatedOn: row.ItemCreatedOn,
                        ModifiedOn: row.ItemModifiedOn
                    ));
                }
            }

            var results = new List<AccessRequestResponse>();
            foreach (var pair in trackingMap.Values)
            {
                var rRow = pair.RequestRow;

                string? reqName = null, reqEmail = null;
                // Fix CS0165: Explicitly pre-assign out variable
                UserProfileInfo? reqProfile = null;
                if (rRow.RequesterId != null && userProfileMap.TryGetValue((string)rRow.RequesterId, out reqProfile))
                {
                    reqName = reqProfile.Name;
                    reqEmail = reqProfile.Email;
                }

                string? tgtName = null, tgtEmail = null;
                // Fix CS0165: Explicitly pre-assign out variable
                UserProfileInfo? targetProfile = null;
                if (rRow.RequestedTo != null && userProfileMap.TryGetValue((string)rRow.RequestedTo, out targetProfile))
                {
                    tgtName = targetProfile.Name;
                    tgtEmail = targetProfile.Email;
                }

                results.Add(new AccessRequestResponse(
                    Id: rRow.RequestId,
                    RequesterId: rRow.RequesterId,
                    RequesterName: reqName,
                    RequesterEmail: reqEmail,
                    RequestedTo: rRow.RequestedTo,
                    RequestedToName: tgtName,
                    RequestedToEmail: tgtEmail,
                    IsAgreed: (AgreementState)rRow.IsAgreed,
                    ITSRNo: rRow.ITSRNo,
                    CreatedOn: rRow.CreatedOn,
                    ModifiedOn: rRow.ModifiedOn,
                    IsActive: (ActiveState)rRow.IsActive,
                    Items: pair.Items.AsReadOnly()
                ));
            }

            return Result<List<AccessRequestResponse>>.Success(results);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error fetching all access requests for user: {UserId}", userId);
            return Result<List<AccessRequestResponse>>.Failure("Database", "Failed to retrieve access requests.");
        }
    }

    public async Task<Result<List<AccessRequestResponse>>> GetRequestsByHodAsync(
    string hodUserId,
    CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(hodUserId))
            return Result<List<AccessRequestResponse>>.Failure("Validation", "HOD User ID is required.");

        const string sql = @"
        SELECT DISTINCT
            r.Id AS RequestId, r.RequesterId, r.RequestedTo, r.IsAgreed, r.ITSRNo, r.CreatedBy, r.CreatedOn, r.ModifiedOn, r.IsActive,
            i.Id AS ItemId, i.TicketNo, i.Status AS ItemStatus, i.FolderPath, i.AccessType, i.ConfirmAccessType, i.ReasonForAccess, i.Comments,
            i.OperatorApproverId, i.CreatedOn AS ItemCreatedOn, i.ModifiedOn AS ItemModifiedOn
        FROM dev.jan_access_requests r
        INNER JOIN dev.jan_access_items i ON r.Id = i.AccessRequestId AND i.IsActive = 1
        LEFT JOIN dev.jan_folder_mappings fm ON TRIM(LOWER(i.FolderPath)) = TRIM(LOWER(fm.FolderName)) AND fm.IsActive = 1
        WHERE r.IsActive = 1
          AND (r.RequestedTo = @HodId OR fm.PrimaryHodId = @HodId OR fm.SecondaryHodId = @HodId);";

        try
        {
            var rows = (await _executor.QueryAsync<dynamic>(
                sql,
                new { HodId = hodUserId },
                commandTimeout: 30,
                cancellationToken: ct)).ToList();

            if (!rows.Any())
                return Result<List<AccessRequestResponse>>.Success(new List<AccessRequestResponse>());

            var uniqueUserIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var row in rows)
            {
                if (row.RequesterId != null) uniqueUserIds.Add((string)row.RequesterId);
                if (row.RequestedTo != null) uniqueUserIds.Add((string)row.RequestedTo);
                if (row.OperatorApproverId != null) uniqueUserIds.Add((string)row.OperatorApproverId);
            }

            var userProfileMap = new Dictionary<string, UserProfileInfo>(StringComparer.OrdinalIgnoreCase);

            if (uniqueUserIds.Any())
            {
                const string batchUserSql = @"
                SELECT 
                    emp_id AS EmpId,
                    MAX(NULLIF(TRIM(CMPL_USER_NAME), '')) AS UserName,
                    MAX(NULLIF(TRIM(MAIL_ID), '')) AS EmailId
                FROM itsr.itsr_users
                WHERE CMPL_USER_ID IN @UserIds OR emp_id IN @UserIds OR MAIL_ID IN @UserIds
                GROUP BY emp_id;";

                using (var MySQLConnection_CMPL = new MySqlConnection(configuration.GetConnectionString("MySQLConnection_CMPL")))
                {
                    var userRows = await MySQLConnection_CMPL.QueryAsync<dynamic>(batchUserSql, new { UserIds = uniqueUserIds.ToList() });
                    foreach (var uRow in userRows)
                    {
                        if (uRow.EmpId != null)
                        {
                            userProfileMap[(string)uRow.EmpId] = new UserProfileInfo
                            {
                                Name = (string)(uRow.UserName ?? string.Empty),
                                Email = (string)(uRow.EmailId ?? string.Empty)
                            };
                        }
                    }
                }
            }

            var trackingMap = new Dictionary<int, (dynamic RequestRow, List<AccessItemResponse> Items)>();

            foreach (var row in rows)
            {
                int requestId = row.RequestId;

                if (!trackingMap.TryGetValue(requestId, out var container))
                {
                    container = (row, new List<AccessItemResponse>());
                    trackingMap.Add(requestId, container);
                }

                if (row.ItemId != null)
                {
                    string? opName = null;
                    string? opEmail = null;

                    UserProfileInfo? opProfile = null;
                    if (row.OperatorApproverId != null && userProfileMap.TryGetValue((string)row.OperatorApproverId, out opProfile))
                    {
                        opName = opProfile.Name;
                        opEmail = opProfile.Email;
                    }

                    container.Items.Add(new AccessItemResponse(
                        Id: row.ItemId,
                        AccessRequestId: requestId,
                        TicketNo: row.TicketNo,
                        Status: (AccessItemStatus)row.ItemStatus,
                        FolderPath: row.FolderPath,
                        AccessType: (AccessType)row.AccessType,
                        ConfirmAccessType: row.ConfirmAccessType != null ? (AccessType?)row.ConfirmAccessType : null,
                        ReasonForAccess: row.ReasonForAccess,
                        Comments: row.Comments,
                        OperatorApproverId: row.OperatorApproverId,
                        OperatorApproverName: opName,
                        OperatorApproverEmail: opEmail,
                        CreatedOn: row.ItemCreatedOn,
                        ModifiedOn: row.ItemModifiedOn
                    ));
                }
            }

            var results = new List<AccessRequestResponse>();
            foreach (var pair in trackingMap.Values)
            {
                var rRow = pair.RequestRow;

                string? reqName = null, reqEmail = null;
                UserProfileInfo? reqProfile = null;
                if (rRow.RequesterId != null && userProfileMap.TryGetValue((string)rRow.RequesterId, out reqProfile))
                {
                    reqName = reqProfile.Name;
                    reqEmail = reqProfile.Email;
                }

                string? tgtName = null, tgtEmail = null;
                UserProfileInfo? targetProfile = null;
                if (rRow.RequestedTo != null && userProfileMap.TryGetValue((string)rRow.RequestedTo, out targetProfile))
                {
                    tgtName = targetProfile.Name;
                    tgtEmail = targetProfile.Email;
                }

                results.Add(new AccessRequestResponse(
                    Id: rRow.RequestId,
                    RequesterId: rRow.RequesterId,
                    RequesterName: reqName,
                    RequesterEmail: reqEmail,
                    RequestedTo: rRow.RequestedTo,
                    RequestedToName: tgtName,
                    RequestedToEmail: tgtEmail,
                    IsAgreed: (AgreementState)rRow.IsAgreed,
                    ITSRNo: rRow.ITSRNo,
                    CreatedOn: rRow.CreatedOn,
                    ModifiedOn: rRow.ModifiedOn,
                    IsActive: (ActiveState)rRow.IsActive,
                    Items: pair.Items.AsReadOnly()
                ));
            }

            return Result<List<AccessRequestResponse>>.Success(results);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error fetching HOD pending items for manager: {HodId}", hodUserId);
            return Result<List<AccessRequestResponse>>.Failure("Database", "Failed to retrieve HOD dashboard data.");
        }
    }

    public async Task<Result<List<AccessRequestResponse>>> GetRequestsByOperatorAsync(
    CancellationToken ct = default)
    {
        const string sql = @"
        SELECT 
            r.Id AS RequestId, r.RequesterId, r.RequestedTo, r.IsAgreed, r.ITSRNo, r.CreatedBy, r.CreatedOn, r.ModifiedOn, r.IsActive,
            i.Id AS ItemId, i.TicketNo, i.Status AS ItemStatus, i.FolderPath, i.AccessType, i.ConfirmAccessType, i.ReasonForAccess, i.Comments,
            i.OperatorApproverId, i.CreatedOn AS ItemCreatedOn, i.ModifiedOn AS ItemModifiedOn
        FROM dev.jan_access_requests r
        INNER JOIN dev.jan_access_items i ON r.Id = i.AccessRequestId
        WHERE r.IsActive = 1 
          AND i.IsActive = 1;";

        try
        {
            var rows = (await _executor.QueryAsync<dynamic>(
                sql,
                commandTimeout: 30,
                cancellationToken: ct)).ToList();

            if (!rows.Any())
                return Result<List<AccessRequestResponse>>.Success(new List<AccessRequestResponse>());

            var uniqueUserIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var row in rows)
            {
                if (row.RequesterId != null) uniqueUserIds.Add((string)row.RequesterId);
                if (row.RequestedTo != null) uniqueUserIds.Add((string)row.RequestedTo);
                if (row.OperatorApproverId != null) uniqueUserIds.Add((string)row.OperatorApproverId);
            }

            var userProfileMap = new Dictionary<string, UserProfileInfo>(StringComparer.OrdinalIgnoreCase);

            if (uniqueUserIds.Any())
            {
                const string batchUserSql = @"
                SELECT 
                    emp_id AS EmpId,
                    MAX(NULLIF(TRIM(CMPL_USER_NAME), '')) AS UserName,
                    MAX(NULLIF(TRIM(MAIL_ID), '')) AS EmailId
                FROM itsr.itsr_users
                WHERE CMPL_USER_ID IN @UserIds OR emp_id IN @UserIds OR MAIL_ID IN @UserIds
                GROUP BY emp_id;";

                using (var MySQLConnection_CMPL = new MySqlConnection(configuration.GetConnectionString("MySQLConnection_CMPL")))
                {
                    var userRows = await MySQLConnection_CMPL.QueryAsync<dynamic>(batchUserSql, new { UserIds = uniqueUserIds.ToList() });
                    foreach (var uRow in userRows)
                    {
                        if (uRow.EmpId != null)
                        {
                            userProfileMap[(string)uRow.EmpId] = new UserProfileInfo
                            {
                                Name = (string)(uRow.UserName ?? string.Empty),
                                Email = (string)(uRow.EmailId ?? string.Empty)
                            };
                        }
                    }
                }
            }

            var trackingMap = new Dictionary<int, (dynamic RequestRow, List<AccessItemResponse> Items)>();

            foreach (var row in rows)
            {
                int requestId = row.RequestId;

                if (!trackingMap.TryGetValue(requestId, out var container))
                {
                    container = (row, new List<AccessItemResponse>());
                    trackingMap.Add(requestId, container);
                }

                if (row.ItemId != null)
                {
                    string? opName = null;
                    string? opEmail = null;

                    UserProfileInfo? opProfile = null;
                    if (row.OperatorApproverId != null && userProfileMap.TryGetValue((string)row.OperatorApproverId, out opProfile))
                    {
                        opName = opProfile.Name;
                        opEmail = opProfile.Email;
                    }

                    container.Items.Add(new AccessItemResponse(
                        Id: row.ItemId,
                        AccessRequestId: requestId,
                        TicketNo: row.TicketNo,
                        Status: (AccessItemStatus)row.ItemStatus,
                        FolderPath: row.FolderPath,
                        AccessType: (AccessType)row.AccessType,
                        ConfirmAccessType: row.ConfirmAccessType != null ? (AccessType?)row.ConfirmAccessType : null,
                        ReasonForAccess: row.ReasonForAccess,
                        Comments: row.Comments,
                        OperatorApproverId: row.OperatorApproverId,
                        OperatorApproverName: opName,
                        OperatorApproverEmail: opEmail,
                        CreatedOn: row.ItemCreatedOn,
                        ModifiedOn: row.ItemModifiedOn
                    ));
                }
            }

            var results = new List<AccessRequestResponse>();
            foreach (var pair in trackingMap.Values)
            {
                var rRow = pair.RequestRow;

                string? reqName = null, reqEmail = null;
                UserProfileInfo? reqProfile = null;
                if (rRow.RequesterId != null && userProfileMap.TryGetValue((string)rRow.RequesterId, out reqProfile))
                {
                    reqName = reqProfile.Name;
                    reqEmail = reqProfile.Email;
                }

                string? tgtName = null, tgtEmail = null;
                UserProfileInfo? targetProfile = null;
                if (rRow.RequestedTo != null && userProfileMap.TryGetValue((string)rRow.RequestedTo, out targetProfile))
                {
                    tgtName = targetProfile.Name;
                    tgtEmail = targetProfile.Email;
                }

                results.Add(new AccessRequestResponse(
                    Id: rRow.RequestId,
                    RequesterId: rRow.RequesterId,
                    RequesterName: reqName,
                    RequesterEmail: reqEmail,
                    RequestedTo: rRow.RequestedTo,
                    RequestedToName: tgtName,
                    RequestedToEmail: tgtEmail,
                    IsAgreed: (AgreementState)rRow.IsAgreed,
                    ITSRNo: rRow.ITSRNo,
                    CreatedOn: rRow.CreatedOn,
                    ModifiedOn: rRow.ModifiedOn,
                    IsActive: (ActiveState)rRow.IsActive,
                    Items: pair.Items.AsReadOnly()
                ));
            }

            return Result<List<AccessRequestResponse>>.Success(results);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error fetching active access items for Operator dashboard.");
            return Result<List<AccessRequestResponse>>.Failure("Database", "Failed to retrieve operator queue.");
        }
    }

    public async Task<Result<AccessRequestResponse>> GetByIdAsync(
    int id,
    CancellationToken ct = default)
    {
        try
        {
            // Step 1: Read the rows as a flat dynamic list to avoid Dapper materialization errors
            using var grid = await _executor.QueryMultipleAsync(
                AccessRequestQueries.GetAccessRequestWithItems,
                new { Id = id },
                commandTimeout: 30,
                cancellationToken: ct);

            // Read everything as flat dynamic rows first
            var flatRows = (await grid.ReadAsync<dynamic>()).ToList();

            if (!flatRows.Any())
                return Result<AccessRequestResponse>.Failure("NotFound", $"Access request with ID {id} not found.");

            // Take the first row to capture the core request details
            var firstRow = flatRows.First();

            // Step 2: Gather unique User IDs for the cross-database lookup
            var uniqueUserIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (firstRow.RequesterId != null) uniqueUserIds.Add((string)firstRow.RequesterId);
            if (firstRow.RequestedTo != null) uniqueUserIds.Add((string)firstRow.RequestedTo);

            foreach (var row in flatRows)
            {
                if (row.OperatorApproverId != null)
                    uniqueUserIds.Add((string)row.OperatorApproverId);
            }

            var userProfileMap = new Dictionary<string, UserProfileInfo>(StringComparer.OrdinalIgnoreCase);

            // Step 3: Fetch the user profiles from the separate connection
            if (uniqueUserIds.Any())
            {
                const string batchUserSql = @"
                SELECT 
                    emp_id AS EmpId,
                    MAX(NULLIF(TRIM(CMPL_USER_NAME), '')) AS UserName,
                    MAX(NULLIF(TRIM(MAIL_ID), '')) AS EmailId
                FROM itsr.itsr_users
                WHERE CMPL_USER_ID IN @UserIds OR emp_id IN @UserIds OR MAIL_ID IN @UserIds
                GROUP BY emp_id;";

                using (var itsrConnection = new MySqlConnection(configuration.GetConnectionString("MySQLConnection_CMPL")))
                {
                    var userRows = await itsrConnection.QueryAsync<dynamic>(batchUserSql, new { UserIds = uniqueUserIds.ToList() });
                    foreach (var uRow in userRows)
                    {
                        if (uRow.EmpId != null)
                        {
                            userProfileMap[(string)uRow.EmpId] = new UserProfileInfo
                            {
                                Name = (string)(uRow.UserName ?? string.Empty),
                                Email = (string)(uRow.EmailId ?? string.Empty)
                            };
                        }
                    }
                }
            }

            // Step 4: Map the child access items safely from the rows list
            var mappedItems = new List<AccessItemResponse>();
            foreach (var row in flatRows)
            {
                // Only add item if an Item ID actually exists (handles left join empty states)
                if (row.ItemId != null || row.Id != null)
                {
                    // In a joint query, the second table's primary key might be aliased as ItemId or just Id depending on your query.
                    // We use fallback checking here.
                    int itemId = row.ItemId ?? row.Id;

                    string? opName = null;
                    string? opEmail = null;
                    UserProfileInfo? opProfile = null;

                    if (row.OperatorApproverId != null && userProfileMap.TryGetValue((string)row.OperatorApproverId, out opProfile))
                    {
                        opName = opProfile.Name;
                        opEmail = opProfile.Email;
                    }

                    mappedItems.Add(new AccessItemResponse(
                        Id: itemId,
                        AccessRequestId: id,
                        TicketNo: row.TicketNo,
                        Status: (AccessItemStatus)row.ItemStatus,
                        FolderPath: row.FolderPath,
                        AccessType: (AccessType)row.AccessType,
                        ConfirmAccessType: row.ConfirmAccessType != null ? (AccessType?)(int)row.ConfirmAccessType : null,
                        ReasonForAccess: row.ReasonForAccess,
                        Comments: row.Comments,
                        OperatorApproverId: row.OperatorApproverId,
                        OperatorApproverName: opName,
                        OperatorApproverEmail: opEmail,
                        CreatedOn: row.ItemCreatedOn ?? row.CreatedOn,
                        ModifiedOn: row.ItemModifiedOn ?? row.ModifiedOn
                    ));
                }
            }

            // Step 5: Extract parent profile details
            string? reqName = null;
            string? reqEmail = null;
            UserProfileInfo? reqProfile = null;
            if (firstRow.RequesterId != null && userProfileMap.TryGetValue((string)firstRow.RequesterId, out reqProfile))
            {
                reqName = reqProfile.Name;
                reqEmail = reqProfile.Email;
            }

            string? tgtName = null;
            string? tgtEmail = null;
            UserProfileInfo? targetProfile = null;
            if (firstRow.RequestedTo != null && userProfileMap.TryGetValue((string)firstRow.RequestedTo, out targetProfile))
            {
                tgtName = targetProfile.Name;
                tgtEmail = targetProfile.Email;
            }

            // Step 6: Construct the final record response directly matching your signature
            var response = new AccessRequestResponse(
                Id: id,
                RequesterId: firstRow.RequesterId,
                RequesterName: reqName,
                RequesterEmail: reqEmail,
                RequestedTo: firstRow.RequestedTo,
                RequestedToName: tgtName,
                RequestedToEmail: tgtEmail,
                IsAgreed: (AgreementState)firstRow.IsAgreed,
                ITSRNo: firstRow.ITSRNo,
                CreatedOn: firstRow.CreatedOn,
                ModifiedOn: firstRow.ModifiedOn,
                IsActive: (ActiveState)firstRow.IsActive,
                Items: mappedItems.AsReadOnly()
            );

            return Result<AccessRequestResponse>.Success(response);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error fetching access request {RequestId}.", id);
            return Result<AccessRequestResponse>.Failure("Database", "Failed to fetch access request.");
        }
    }

    public async Task<Result<AccessRequestResponse>> GetByItemIdAsync(
    int itemId,
    CancellationToken ct = default)
    {
        try
        {
            // Step 1: Find the parent RequestId first, then pull the request with all its items
            const string findRequestAndItemsSql = @"
            SELECT 
                r.Id AS RequestId, r.RequesterId, r.RequestedTo, r.IsAgreed, r.ITSRNo, r.CreatedBy, r.CreatedOn, r.ModifiedOn, r.IsActive,
                i.Id AS ItemId, i.TicketNo, i.Status AS ItemStatus, i.FolderPath, i.AccessType, i.ConfirmAccessType, i.ReasonForAccess, i.Comments,
                i.OperatorApproverId, i.CreatedOn AS ItemCreatedOn, i.ModifiedOn AS ItemModifiedOn
            FROM dev.jan_access_requests r
            INNER JOIN dev.jan_access_items i ON r.Id = i.AccessRequestId
            WHERE r.Id = (SELECT AccessRequestId FROM dev.jan_access_items WHERE Id = @ItemId LIMIT 1);";

            var flatRows = (await _executor.QueryAsync<dynamic>(
                findRequestAndItemsSql,
                new { ItemId = itemId },
                commandTimeout: 30,
                cancellationToken: ct)).ToList();

            if (!flatRows.Any())
                return Result<AccessRequestResponse>.Failure("NotFound", $"Access request containing Item ID {itemId} not found.");

            // Take the first row to capture the core request details
            var firstRow = flatRows.First();
            int parentRequestId = firstRow.RequestId;

            // Step 2: Gather unique User IDs for the cross-database lookup
            var uniqueUserIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (firstRow.RequesterId != null) uniqueUserIds.Add((string)firstRow.RequesterId);
            if (firstRow.RequestedTo != null) uniqueUserIds.Add((string)firstRow.RequestedTo);

            foreach (var row in flatRows)
            {
                if (row.OperatorApproverId != null)
                    uniqueUserIds.Add((string)row.OperatorApproverId);
            }

            var userProfileMap = new Dictionary<string, UserProfileInfo>(StringComparer.OrdinalIgnoreCase);

            // Step 3: Fetch the user profiles from the separate connection
            if (uniqueUserIds.Any())
            {
                const string batchUserSql = @"
                SELECT 
                    emp_id AS EmpId,
                    MAX(NULLIF(TRIM(CMPL_USER_NAME), '')) AS UserName,
                    MAX(NULLIF(TRIM(MAIL_ID), '')) AS EmailId
                FROM itsr.itsr_users
                WHERE CMPL_USER_ID IN @UserIds OR emp_id IN @UserIds OR MAIL_ID IN @UserIds
                GROUP BY emp_id;";

                using (var itsrConnection = new MySqlConnection(configuration.GetConnectionString("MySQLConnection_CMPL")))
                {
                    var userRows = await itsrConnection.QueryAsync<dynamic>(batchUserSql, new { UserIds = uniqueUserIds.ToList() });
                    foreach (var uRow in userRows)
                    {
                        if (uRow.EmpId != null)
                        {
                            userProfileMap[(string)uRow.EmpId] = new UserProfileInfo
                            {
                                Name = (string)(uRow.UserName ?? string.Empty),
                                Email = (string)(uRow.EmailId ?? string.Empty)
                            };
                        }
                    }
                }
            }

            // Step 4: Map the child access items safely from the rows list
            var mappedItems = new List<AccessItemResponse>();
            foreach (var row in flatRows)
            {
                if (row.ItemId != null)
                {
                    string? opName = null;
                    string? opEmail = null;
                    UserProfileInfo? opProfile = null;

                    if (row.OperatorApproverId != null && userProfileMap.TryGetValue((string)row.OperatorApproverId, out opProfile))
                    {
                        opName = opProfile.Name;
                        opEmail = opProfile.Email;
                    }

                    mappedItems.Add(new AccessItemResponse(
                        Id: row.ItemId,
                        AccessRequestId: parentRequestId,
                        TicketNo: row.TicketNo,
                        Status: (AccessItemStatus)(row.ItemStatus ?? row.Status),
                        FolderPath: row.FolderPath,
                        AccessType: (AccessType)row.AccessType,
                        ConfirmAccessType: row.ConfirmAccessType != null ? (AccessType?)(int)row.ConfirmAccessType : null,
                        ReasonForAccess: row.ReasonForAccess,
                        Comments: row.Comments,
                        OperatorApproverId: row.OperatorApproverId,
                        OperatorApproverName: opName,
                        OperatorApproverEmail: opEmail,
                        CreatedOn: row.ItemCreatedOn ?? row.CreatedOn,
                        ModifiedOn: row.ItemModifiedOn ?? row.ModifiedOn
                    ));
                }
            }

            // Step 5: Extract parent profile details
            string? reqName = null;
            string? reqEmail = null;
            UserProfileInfo? reqProfile = null;
            if (firstRow.RequesterId != null && userProfileMap.TryGetValue((string)firstRow.RequesterId, out reqProfile))
            {
                reqName = reqProfile.Name;
                reqEmail = reqProfile.Email;
            }

            string? tgtName = null;
            string? tgtEmail = null;
            UserProfileInfo? targetProfile = null;
            if (firstRow.RequestedTo != null && userProfileMap.TryGetValue((string)firstRow.RequestedTo, out targetProfile))
            {
                tgtName = targetProfile.Name;
                tgtEmail = targetProfile.Email;
            }

            // Step 6: Construct and return the final structural record response object
            var response = new AccessRequestResponse(
                Id: parentRequestId,
                RequesterId: firstRow.RequesterId,
                RequesterName: reqName,
                RequesterEmail: reqEmail,
                RequestedTo: firstRow.RequestedTo,
                RequestedToName: tgtName,
                RequestedToEmail: tgtEmail,
                IsAgreed: (AgreementState)firstRow.IsAgreed,
                ITSRNo: firstRow.ITSRNo,
                CreatedOn: firstRow.CreatedOn,
                ModifiedOn: firstRow.ModifiedOn,
                IsActive: (ActiveState)firstRow.IsActive,
                Items: mappedItems.AsReadOnly()
            );

            return Result<AccessRequestResponse>.Success(response);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error fetching access request details via Item ID {ItemId}.", itemId);
            return Result<AccessRequestResponse>.Failure("Database", "Failed to fetch access request details.");
        }
    }

    public async Task<Result<IReadOnlyList<AccessItemResponse>>> GetItemsByRequestIdAsync(
        int requestId,
        CancellationToken ct = default)
    {
        try
        {
            var exists = await _executor.ExecuteScalarAsync<int>(
                AccessRequestQueries.CheckAccessRequestExists,
                new { Id = requestId },
                commandTimeout: 10,
                cancellationToken: ct);

            if (exists == 0)
                return Result<IReadOnlyList<AccessItemResponse>>.Failure("NotFound", $"Access request with ID {requestId} not found.");

            var items = await _executor.QueryAsync<AccessItemResponse>(
                AccessRequestQueries.GetAccessItemsByRequestId,
                new { RequestId = requestId },
                commandTimeout: 30,
                cancellationToken: ct);

            return Result<IReadOnlyList<AccessItemResponse>>.Success(items.ToList());
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error fetching items for request {RequestId}.", requestId);
            return Result<IReadOnlyList<AccessItemResponse>>.Failure("Database", "Failed to fetch access items.");
        }
    }

    public async Task<Result<(string? PrimaryHodId, string? SecondaryHodId)>> GetHodByFolderPathAsync(
        string folderPath,
        CancellationToken ct = default)
    {
        try
        {
            string parentFolderName = folderPath.Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries)
                                  .ElementAtOrDefault(2) ?? string.Empty;

            var folderHod = await _executor.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT PrimaryHodId, SecondaryHodId FROM dev.jan_folder_mappings WHERE FolderName LIKE CONCAT('%', @ParentName, '%') AND IsActive = 1;",
                new { ParentName = parentFolderName },
                commandTimeout: 10,
                cancellationToken: ct);
            if (folderHod == null)
                return Result<(string?, string?)>.Failure("NotFound", $"No HOD configuration found for folder path: '{folderPath}'");
            return Result<(string?, string?)>.Success((folderHod.PrimaryHodId, folderHod.SecondaryHodId));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error fetching HOD configuration for folder path: {FolderPath}.", folderPath);
            return Result<(string?, string?)>.Failure("Database", "Failed to fetch HOD configuration.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════

    public async Task<Result> UpdateItemAsync(
        UpdateAccessItemDto dto,
        CancellationToken ct = default)
    {
        try
        {
            var currentStatus = await _executor.QueryFirstOrDefaultAsync<int?>(
                AccessRequestQueries.GetAccessItemStatus,
                new { Id = dto.AccessItemId },
                commandTimeout: 10,
                cancellationToken: ct);

            if (currentStatus is null)
                return Result.Failure("NotFound", $"Access item with ID {dto.AccessItemId} not found.");

            if (currentStatus != (int)AccessItemStatus.Submitted)
                return Result.Failure("InvalidState", "Can only update items in 'Submitted' status.");

            var rowsAffected = await _executor.ExecuteAsync(
                AccessRequestQueries.UpdateAccessItem,
                new
                {
                    Id = dto.AccessItemId,
                    dto.FolderPath,
                    AccessType = dto.AccessType.HasValue ? (int?)dto.AccessType.Value : null,
                    ConfirmAccessType = dto.ConfirmAccessType.HasValue ? (int?)dto.ConfirmAccessType.Value : null,
                    dto.ReasonForAccess,
                    ModifiedBy = "system"
                },
                commandTimeout: 30,
                cancellationToken: ct);

            if (rowsAffected == 0)
                return Result.Failure("Database", "No rows were updated.");

            return Result.Success();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error updating access item {ItemId}.", dto.AccessItemId);
            return Result.Failure("Internal", "Failed to update access item.");
        }
    }

    public async Task<Result> HodDecisionAsync(
        HodApproveOrRejectDto dto,
        string modifiedBy,
        CancellationToken ct = default)
    {
        try
        {
            var currentStatus = await _executor.QueryFirstOrDefaultAsync<int?>(
                AccessRequestQueries.GetAccessItemStatus,
                new { Id = dto.AccessItemId },
                commandTimeout: 10,
                cancellationToken: ct);

            var req = await GetByItemIdAsync(dto.AccessItemId, ct);

            if (req is { IsSuccess: true, Value: not null })
            {
                var matchingItem = req.Value.Items.FirstOrDefault(i => i.Id == dto.AccessItemId);

                if (matchingItem != null)
                {
                    string folderPath = matchingItem.FolderPath;

                    string parentFolderName = folderPath
                        .Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries)
                        .LastOrDefault() ?? string.Empty;

                    var folderHod = await _executor.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT PrimaryHodId, SecondaryHodId FROM dev.jan_folder_mappings WHERE FolderName LIKE CONCAT('%', @ParentName, '%') AND IsActive = 1;",
                        new { ParentName = parentFolderName },
                        commandTimeout: 10,
                        cancellationToken: ct);

                    if (folderHod == null)
                        throw new InvalidOperationException($"No configuration mapping found for folder variant: '{parentFolderName}'");

                    string? primaryHod = folderHod.PrimaryHodId;
                    string? secondaryHod = folderHod.SecondaryHodId;
                    string currentRequestedTo = req.Value.RequestedTo;

                    bool isValidHod = string.Equals(currentRequestedTo, primaryHod, StringComparison.OrdinalIgnoreCase) ||
                                       string.Equals(currentRequestedTo, secondaryHod, StringComparison.OrdinalIgnoreCase);

                    if (!isValidHod)
                    {
                        throw new InvalidOperationException(
                            $"Access Denied. The assigned routing field 'RequestedTo' ({currentRequestedTo}) does not match the legal HODs configured for this folder mapping context.");
                    }
                }
            }

            if (currentStatus is null)
                return Result.Failure("NotFound", $"Access item with ID {dto.AccessItemId} not found.");

            if (currentStatus != (int)AccessItemStatus.Submitted)
                return Result.Failure("InvalidState", "Item must be in 'Submitted' status for HOD decision.");

            var rowsAffected = await _executor.ExecuteAsync(
                AccessRequestQueries.UpdateHodDecision,
                new
                {
                    Id = dto.AccessItemId,
                    Status = (int)dto.Status,
                    dto.FolderPath,
                    ConfirmAccessType = dto.ConfirmAccessType.HasValue ? (int?)dto.ConfirmAccessType.Value : null,
                    dto.Comments,
                    ModifiedBy = modifiedBy,
                    ExpectedStatus = (int)AccessItemStatus.Submitted
                },
                commandTimeout: 30,
                cancellationToken: ct);

            if (rowsAffected == 0)
                return Result.Failure("Conflict", "HOD decision could not be applied. Item may have been modified by another process.");

            return Result.Success();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error applying HOD decision for item {ItemId}.", dto.AccessItemId);
            return Result.Failure("Internal", "Failed to apply HOD decision.");
        }
    }

    public async Task<Result> OperatorDecisionAsync(
        OperatorApproveOrRejectDto dto,
        string modifiedBy,
        CancellationToken ct = default)
    {
        try
        {
            var currentStatus = await _executor.QueryFirstOrDefaultAsync<int?>(
                AccessRequestQueries.GetAccessItemStatus,
                new { Id = dto.AccessItemId },
                commandTimeout: 10,
                cancellationToken: ct);

            if (currentStatus is null)
                return Result.Failure("NotFound", $"Access item with ID {dto.AccessItemId} not found.");

            if (currentStatus != (int)AccessItemStatus.HodApproved)
                return Result.Failure("InvalidState", "Item must be in 'HodApproved' status for operator decision.");

            var rowsAffected = await _executor.ExecuteAsync(
                AccessRequestQueries.UpdateOperatorDecision,
                new
                {
                    Id = dto.AccessItemId,
                    Status = (int)dto.Status,
                    dto.Comments,
                    dto.OperatorApproverId,
                    ModifiedBy = modifiedBy,
                    ExpectedStatus = (int)AccessItemStatus.HodApproved
                },
                commandTimeout: 30,
                cancellationToken: ct);

            if (rowsAffected == 0)
                return Result.Failure("Conflict", "Operator decision could not be applied.");

            return Result.Success();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error applying operator decision for item {ItemId}.", dto.AccessItemId);
            return Result.Failure("Internal", "Failed to apply operator decision.");
        }
    }

    public async Task<Result> RenewAsync(
        AccessRequestRenewalDto dto,
        string modifiedBy,
        CancellationToken ct = default)
    {
        try
        {
            var currentStatus = await _executor.QueryFirstOrDefaultAsync<int?>(
                AccessRequestQueries.GetAccessItemStatus,
                new { Id = dto.AccessItemId },
                commandTimeout: 10,
                cancellationToken: ct);

            if (currentStatus is null)
                return Result.Failure("NotFound", $"Access item with ID {dto.AccessItemId} not found.");

            var allowedStatuses = new[] { (int)AccessItemStatus.AccessGranted, (int)AccessItemStatus.AccessExpired };

            if (!allowedStatuses.Contains(currentStatus.Value))
                return Result.Failure("InvalidState", "Can only renew items with status 'AccessGranted' or 'AccessExpired'.");

            var rowsAffected = await _executor.ExecuteAsync(
                AccessRequestQueries.RenewAccessItem,
                new
                {
                    Id = dto.AccessItemId,
                    Status = (int)AccessItemStatus.Submitted,
                    AccessType = (int)dto.AccessType,
                    ConfirmAccessType = dto.ConfirmAccessType.HasValue ? (int?)dto.ConfirmAccessType.Value : null,
                    ModifiedBy = modifiedBy,
                    AllowedStatuses = allowedStatuses
                },
                commandTimeout: 30,
                cancellationToken: ct);

            if (rowsAffected == 0)
                return Result.Failure("Conflict", "Renewal could not be applied.");

            return Result.Success();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error renewing access item {ItemId}.", dto.AccessItemId);
            return Result.Failure("Internal", "Failed to renew access item.");
        }
    }

    public async Task<Result> RevokeAsync(
        AccessRequestRevokeDto dto,
        string modifiedBy,
        CancellationToken ct = default)
    {
        try
        {
            var currentStatus = await _executor.QueryFirstOrDefaultAsync<int?>(
                AccessRequestQueries.GetAccessItemStatus,
                new { Id = dto.AccessItemId },
                commandTimeout: 10,
                cancellationToken: ct);

            if (currentStatus is null)
                return Result.Failure("NotFound", $"Access item with ID {dto.AccessItemId} not found.");

            var allowedStatuses = new[]
            {
                (int)AccessItemStatus.AccessGranted,
                (int)AccessItemStatus.HodApproved,
                (int)AccessItemStatus.OperatorApproved
            };

            if (!allowedStatuses.Contains(currentStatus.Value))
                return Result.Failure("InvalidState", "Can only revoke active or approved items.");

            var rowsAffected = await _executor.ExecuteAsync(
                AccessRequestQueries.RevokeAccessItem,
                new
                {
                    Id = dto.AccessItemId,
                    Status = (int)AccessItemStatus.AccessRevoked,
                    AccessType = (int)AccessType.NotApplicable,
                    ConfirmAccessType = (int?)null,
                    ModifiedBy = modifiedBy,
                    AllowedStatuses = allowedStatuses
                },
                commandTimeout: 30,
                cancellationToken: ct);

            if (rowsAffected == 0)
                return Result.Failure("Conflict", "Revoke could not be applied.");

            return Result.Success();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error revoking access item {ItemId}.", dto.AccessItemId);
            return Result.Failure("Internal", "Failed to revoke access item.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // DELETE (Soft Delete)
    // ═══════════════════════════════════════════════════════

    public async Task<Result> SoftDeleteItemAsync(
        DeleteAccessItemDto dto,
        CancellationToken ct = default)
    {
        try
        {
            var exists = await _executor.ExecuteScalarAsync<int>(
                AccessRequestQueries.CheckAccessItemExists,
                new { Id = dto.AccessItemId },
                commandTimeout: 10,
                cancellationToken: ct);

            if (exists == 0)
                return Result.Failure("NotFound", $"Access item with ID {dto.AccessItemId} not found.");

            var rowsAffected = await _executor.ExecuteAsync(
                AccessRequestQueries.SoftDeleteAccessItem,
                new { Id = dto.AccessItemId, ModifiedBy = dto.ModifiedBy },
                commandTimeout: 30,
                cancellationToken: ct);

            if (rowsAffected == 0)
                return Result.Failure("Database", "Soft delete failed for access item.");

            return Result.Success();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error soft-deleting access item {ItemId}.", dto.AccessItemId);
            return Result.Failure("Internal", "Failed to delete access item.");
        }
    }

    public async Task<Result> SoftDeleteRequestAsync(
        int id,
        string modifiedBy,
        CancellationToken ct = default)
    {
        try
        {
            await _executor.ExecuteInTransactionAsync(
                async tx =>
                {
                    var exists = await _executor.ExecuteScalarAsync<int>(
                        AccessRequestQueries.CheckAccessRequestExists,
                        new { Id = id },
                        tx,
                        commandTimeout: 10,
                        cancellationToken: ct);

                    if (exists == 0)
                        throw new InvalidOperationException($"Access request with ID {id} not found.");

                    await _executor.ExecuteAsync(
                        AccessRequestQueries.SoftDeleteAccessItemsByRequestId,
                        new { RequestId = id, ModifiedBy = modifiedBy },
                        tx,
                        commandTimeout: 30,
                        cancellationToken: ct);

                    var rowsAffected = await _executor.ExecuteAsync(
                        AccessRequestQueries.SoftDeleteAccessRequest,
                        new { Id = id, ModifiedBy = modifiedBy },
                        tx,
                        commandTimeout: 30,
                        cancellationToken: ct);

                    if (rowsAffected == 0)
                        throw new InvalidOperationException("Soft delete failed for access request.");
                },
                IsolationLevel.ReadCommitted,
                commandTimeout: 60,
                cancellationToken: ct);

            return Result.Success();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business rule violation during soft delete.");
            return Result.Failure("NotFound", ex.Message);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error soft-deleting access request {RequestId}.", id);
            return Result.Failure("Internal", "Failed to delete access request.");
        }
    }
}
