namespace Server.Features.Folder;

public static class FolderQueries
{
    public const string GetAllFolders = @"
        SELECT 
            Id, FolderName, PrimaryHodId, SecondaryHodId, 
            CreatedBy, CreatedOn, ModifiedBy, ModifiedOn, 
            IsActive
        FROM jan_folder_mappings
        WHERE IsActive = 1;";

    public const string GetFoldersByHodId = @"
        SELECT 
            Id, FolderName, PrimaryHodId, SecondaryHodId, 
            CreatedBy, CreatedOn, ModifiedBy, ModifiedOn, 
            IsActive
        FROM jan_folder_mappings
        WHERE IsActive = 1 
          AND (PrimaryHodId = @HodId OR SecondaryHodId = @HodId);";

    public const string GetFolderById = @"
        SELECT 
            Id, FolderName, PrimaryHodId, SecondaryHodId, 
            CreatedBy, CreatedOn, ModifiedBy, ModifiedOn, 
            IsActive
        FROM jan_folder_mappings
        WHERE Id = @Id;";

    public const string InsertFolder = @"
        INSERT INTO jan_folder_mappings 
            (FolderName, PrimaryHodId, SecondaryHodId, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn, IsActive)
        VALUES 
            (@FolderName, @PrimaryHodId, @SecondaryHodId, @CreatedBy, NOW(), @CreatedBy, NOW(), 1);
        SELECT LAST_INSERT_ID();";

    public const string UpdateFolder = @"
        UPDATE jan_folder_mappings
        SET 
            FolderName = @FolderName,
            PrimaryHodId = @PrimaryHodId,
            SecondaryHodId = @SecondaryHodId,
            ModifiedBy = @ModifiedBy,
            ModifiedOn = NOW()
        WHERE Id = @Id AND IsActive = 1;";

    public const string SoftDeleteFolder = @"
        UPDATE jan_folder_mappings
        SET 
            IsActive = 0,
            ModifiedBy = @ModifiedBy,
            ModifiedOn = NOW()
        WHERE Id = @Id AND IsActive = 1;";

    public const string GetParsedNtfsPermissionsAudit = @"
        SELECT DISTINCT
                FolderPath
            FROM dev.jan_ntfs_permissions_audit
            WHERE FolderPath IS NOT NULL
            ORDER BY FolderPath;";
}
