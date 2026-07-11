namespace Server.Features.Users;

public class UserDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? EmpId { get; set; }
    public string? MailId { get; set; }
    public long? MobNo { get; set; }
    public int? DeptId { get; set; }
    public string? Role { get; set; }
    public string? Location { get; set; }
    public DateTime CreatedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public int IsActive { get; set; }
}

public class UpdateUserRoleRequest
{
    public string UserId { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? Location { get; set; }
}