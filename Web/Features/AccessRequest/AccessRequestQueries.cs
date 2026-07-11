namespace Server.Features.AccessRequest;

public static class AccessRequestQueries
{
    public const string DashboardSummary = @"
            SELECT 
                COUNT(*) AS TotalAccessItems,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveItems,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) AS InactiveItems,
                SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) AS Status_Submitted,
                SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) AS Status_HodApproved,
                SUM(CASE WHEN Status = 2 THEN 1 ELSE 0 END) AS Status_HodRejected,
                SUM(CASE WHEN Status = 3 THEN 1 ELSE 0 END) AS Status_OperatorApproved,
                SUM(CASE WHEN Status = 4 THEN 1 ELSE 0 END) AS Status_OperatorRejected,
                SUM(CASE WHEN Status = 5 THEN 1 ELSE 0 END) AS Status_AccessGranted,
                SUM(CASE WHEN Status = 6 THEN 1 ELSE 0 END) AS Status_AccessDenied,
                SUM(CASE WHEN Status = 7 THEN 1 ELSE 0 END) AS Status_AccessExpired,
                SUM(CASE WHEN Status = 8 THEN 1 ELSE 0 END) AS Status_AccessRevoked,
                SUM(CASE WHEN AccessType = 0 THEN 1 ELSE 0 END) AS Type_NotApplicable,
                SUM(CASE WHEN AccessType = 1 THEN 1 ELSE 0 END) AS Type_ReadOnly,
                SUM(CASE WHEN AccessType = 2 THEN 1 ELSE 0 END) AS Type_ReadAndWrite,
                SUM(CASE WHEN Status IN (0, 1, 3) THEN 1 ELSE 0 END) AS TotalPendingAction
            FROM jan_access_items
            WHERE IsActive = 1;";

    // ═══════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════

    public const string InsertAccessRequest = @"
        INSERT INTO jan_access_requests 
            (RequesterId, RequestedTo, IsAgreed, ITSRNo, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn, IsActive)
        VALUES 
            (@RequesterId, @RequestedTo, @IsAgreed, @ITSRNo, @CreatedBy, UTC_TIMESTAMP(), @ModifiedBy, UTC_TIMESTAMP(), @IsActive);
        SELECT LAST_INSERT_ID();";

    public const string InsertAccessItem = @"
        INSERT INTO jan_access_items 
            (AccessRequestId, TicketNo, Status, FolderPath, AccessType, ConfirmAccessType, ReasonForAccess, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn, IsActive)
        VALUES 
            (@AccessRequestId, @TicketNo, @Status, @FolderPath, @AccessType, @ConfirmAccessType, @ReasonForAccess, @CreatedBy, UTC_TIMESTAMP(), @ModifiedBy, UTC_TIMESTAMP(), @IsActive);
        SELECT LAST_INSERT_ID();";

    // ═══════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════

    public const string GetAccessRequestById = @"
        SELECT 
            ar.Id, ar.RequesterId, ar.RequestedTo, ar.IsAgreed, ar.ITSRNo,
            ar.CreatedBy, ar.CreatedOn, ar.ModifiedBy, ar.ModifiedOn, ar.IsActive
        FROM jan_access_requests ar
        WHERE ar.Id = @Id AND ar.IsActive = 1;";

    // FIXED: was Getjan_access_itemsByRequestId
    public const string GetAccessItemsByRequestId = @"
        SELECT 
            ai.Id, ai.AccessRequestId, ai.TicketNo, ai.Status, ai.FolderPath,
            ai.AccessType, ai.ConfirmAccessType, ai.ReasonForAccess, ai.Comments,
            ai.OperatorApproverId, ai.CreatedBy, ai.CreatedOn, ai.ModifiedBy, ai.ModifiedOn, ai.IsActive
        FROM jan_access_items ai
        WHERE ai.AccessRequestId = @RequestId AND ai.IsActive = 1
        ORDER BY ai.CreatedOn DESC;";

    public const string GetAccessItemById = @"
        SELECT 
            ai.Id, ai.AccessRequestId, ai.TicketNo, ai.Status, ai.FolderPath,
            ai.AccessType, ai.ConfirmAccessType, ai.ReasonForAccess, ai.Comments,
            ai.OperatorApproverId, ai.CreatedBy, ai.CreatedOn, ai.ModifiedBy, ai.ModifiedOn, ai.IsActive
        FROM jan_access_items ai
        WHERE ai.Id = @Id AND ai.IsActive = 1;";

    public const string GetAccessRequestWithItems = @"
        SELECT 
            ar.Id, ar.RequesterId, ar.RequestedTo, ar.IsAgreed, ar.ITSRNo,
            ar.CreatedBy, ar.CreatedOn, ar.ModifiedBy, ar.ModifiedOn, ar.IsActive,
            ai.Id, ai.AccessRequestId, ai.TicketNo, ai.Status as ItemStatus, ai.FolderPath,
            ai.AccessType, ai.ConfirmAccessType, ai.ReasonForAccess, ai.Comments,
            ai.OperatorApproverId, ai.CreatedBy, ai.CreatedOn, ai.ModifiedBy, ai.ModifiedOn, ai.IsActive
        FROM jan_access_requests ar
        LEFT JOIN jan_access_items ai ON ar.Id = ai.AccessRequestId AND ai.IsActive = 1
        WHERE ar.Id = @Id AND ar.IsActive = 1
        ORDER BY ai.CreatedOn DESC;";

    // FIXED: was GetPagedjan_access_requests
    public const string GetPagedAccessRequests = @"
        SELECT 
            ar.Id, ar.RequesterId, ar.RequestedTo, ar.IsAgreed, ar.ITSRNo,
            ar.CreatedBy, ar.CreatedOn, ar.ModifiedBy, ar.ModifiedOn, ar.IsActive
        FROM jan_access_requests ar
        WHERE ar.IsActive = 1
            AND (@RequesterId IS NULL OR ar.RequesterId = @RequesterId)
            AND (@RequestedTo IS NULL OR ar.RequestedTo = @RequestedTo)
            AND (@FromDate IS NULL OR ar.CreatedOn >= @FromDate)
            AND (@ToDate IS NULL OR ar.CreatedOn <= @ToDate)
        ORDER BY ar.CreatedOn DESC
        LIMIT @PageSize OFFSET @Offset;";

    // FIXED: was Countjan_access_requests
    public const string CountAccessRequests = @"
        SELECT COUNT(*) 
        FROM jan_access_requests ar
        WHERE ar.IsActive = 1
            AND (@RequesterId IS NULL OR ar.RequesterId = @RequesterId)
            AND (@RequestedTo IS NULL OR ar.RequestedTo = @RequestedTo)
            AND (@FromDate IS NULL OR ar.CreatedOn >= @FromDate)
            AND (@ToDate IS NULL OR ar.CreatedOn <= @ToDate);";

    // ═══════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════

    public const string UpdateAccessItem = @"
        UPDATE jan_access_items 
        SET 
            FolderPath = COALESCE(@FolderPath, FolderPath),
            AccessType = COALESCE(@AccessType, AccessType),
            ConfirmAccessType = COALESCE(@ConfirmAccessType, ConfirmAccessType),
            ReasonForAccess = COALESCE(@ReasonForAccess, ReasonForAccess),
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1;";

    // FIXED: was Updatejan_access_itemstatus
    public const string UpdateAccessItemStatus = @"
        UPDATE jan_access_items 
        SET 
            Status = @Status,
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1;";

    public const string UpdateHodDecision = @"
        UPDATE jan_access_items 
        SET 
            Status = @Status,
            FolderPath = COALESCE(@FolderPath, FolderPath),
            ConfirmAccessType = COALESCE(@ConfirmAccessType, ConfirmAccessType),
            Comments = COALESCE(@Comments, Comments),
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1 AND Status = @ExpectedStatus;";

    public const string UpdateOperatorDecision = @"
        UPDATE jan_access_items 
        SET 
            Status = @Status,
            Comments = COALESCE(@Comments, Comments),
            OperatorApproverId = @OperatorApproverId,
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1 AND Status = @ExpectedStatus;";

    public const string RenewAccessItem = @"
        UPDATE jan_access_items 
        SET 
            Status = @Status,
            AccessType = @AccessType,
            ConfirmAccessType = COALESCE(@ConfirmAccessType, ConfirmAccessType),
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1 AND Status IN @AllowedStatuses;";

    public const string RevokeAccessItem = @"
        UPDATE jan_access_items 
        SET 
            Status = @Status,
            AccessType = @AccessType,
            ConfirmAccessType = COALESCE(@ConfirmAccessType, ConfirmAccessType),
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1 AND Status IN @AllowedStatuses;";

    // ═══════════════════════════════════════════════════════
    // DELETE (Soft Delete)
    // ═══════════════════════════════════════════════════════

    public const string SoftDeleteAccessItem = @"
        UPDATE jan_access_items 
        SET 
            IsActive = 0,
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1;";

    public const string SoftDeleteAccessRequest = @"
        UPDATE jan_access_requests 
        SET 
            IsActive = 0,
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE Id = @Id AND IsActive = 1;";

    // FIXED: was SoftDeletejan_access_itemsByRequestId
    public const string SoftDeleteAccessItemsByRequestId = @"
        UPDATE jan_access_items 
        SET 
            IsActive = 0,
            ModifiedBy = @ModifiedBy,
            ModifiedOn = UTC_TIMESTAMP()
        WHERE AccessRequestId = @RequestId AND IsActive = 1;";

    // ═══════════════════════════════════════════════════════
    // VALIDATION / UTILITY
    // ═══════════════════════════════════════════════════════

    public const string CheckAccessItemExists = @"
        SELECT COUNT(1) 
        FROM jan_access_items 
        WHERE Id = @Id AND IsActive = 1;";

    public const string CheckAccessRequestExists = @"
        SELECT COUNT(1) 
        FROM jan_access_requests 
        WHERE Id = @Id AND IsActive = 1;";

    // FIXED: was Getjan_access_itemstatus
    public const string GetAccessItemStatus = @"
        SELECT Status
        FROM jan_access_items 
        WHERE Id = @Id AND IsActive = 1;";

    public const string GetAccessRequestItemCount = @"
        SELECT COUNT(1) 
        FROM jan_access_items 
        WHERE AccessRequestId = @RequestId AND IsActive = 1;";

    public const string GetNextSequenceForTicketNumber = @"
        SELECT COALESCE(AUTO_INCREMENT, 1)
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = 'dev'
          AND TABLE_NAME = 'jan_access_requests'";
}