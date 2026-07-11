namespace Server.Features.Users;

public static class UserQueries
{
    public const string GetPortalUsersBase = @"
        SELECT 
            Id AS UserId, 
            Role, 
            Location, 
            CreatedOn, 
            CreatedBy, 
            ModifiedBy, 
            ModifiedOn, 
            IsActive 
        FROM jan_portal_users;";

    public const string GetPortalUsersByRole = @"
        SELECT 
            Id AS UserId, 
            Role, 
            Location, 
            CreatedOn, 
            CreatedBy, 
            ModifiedBy, 
            ModifiedOn, 
            IsActive 
        FROM jan_portal_users
        WHERE Role = @Role;";

    public const string GetPortalUserById = @"
        SELECT 
            Id AS UserId, 
            Role, 
            Location, 
            CreatedOn, 
            CreatedBy, 
            ModifiedBy, 
            ModifiedOn, 
            IsActive 
        FROM jan_portal_users
        WHERE Id = @Id;";

    public const string GetComplianceUsersById = @"
        SELECT 
            CMPL_USER_ID AS UserId, 
            CMPL_USER_NAME AS UserName, 
            EMP_ID AS EmpId, 
            MAIL_ID AS MailId, 
            MOB_NO AS MobNo, 
            DEPT_ID AS DeptId 
        FROM itsr_users 
       WHERE CAST(CMPL_USER_ID AS CHAR) = @Id 
       OR MAIL_ID = @Id 
       OR EMP_ID = @Id;";

    public const string GetComplianceUsersByIds = @"
        SELECT 
            CMPL_USER_ID AS UserId, 
            CMPL_USER_NAME AS UserName, 
            EMP_ID AS EmpId, 
            MAIL_ID AS MailId, 
            MOB_NO AS MobNo, 
            DEPT_ID AS DeptId 
        FROM cmplusers 
        WHERE CMPL_USER_ID IN @Ids;";

    public const string UpdateUserPortalProfile = @"
        UPDATE jan_portal_users
        SET 
            Role = @Role,
            Location = @Location,
            ModifiedOn = NOW()
        WHERE Id = @Id;";
}
