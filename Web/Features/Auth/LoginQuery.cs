namespace Server.Utilities.Queries;

public static class LoginQuery
{
    public const string AuthenticateComplianceUser = @"
        SELECT 
            CMPL_USER_ID AS UserId,
            CMPL_USER_NAME AS UserName,
            EMP_ID AS EmpId,
            MAIL_ID AS MailId,
            MOB_NO AS MobNo,
            DEPT_ID AS DeptId
        FROM itsr_users
        WHERE (MAIL_ID = @Identifier OR EMP_ID = @Identifier OR CMPL_USER_NAME = @Identifier) 
          AND CMPL_USER_KEY = @Password;";

    public const string GetPortalUserPermissions = @"
        SELECT 
            Id AS UserId,
            Role,
            Location,
            CreatedBy,
            CreatedOn,
            ModifiedBy,
            ModifiedOn,
            IsActive
        FROM dev.jan_portal_users
        WHERE Id = @UserId;";
}
