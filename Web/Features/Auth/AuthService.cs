using Server.Common;
using Server.Features.DynamicQueryExecutor;
using Server.Features.Users;
using Server.Utilities.Queries;

namespace Server.Features.Auth;

public class AuthService(IDynamicQueryExecutor executor, ILogger<AuthService> logger, IConfiguration configuration) : IAuthService
{
    private readonly IDynamicQueryExecutor _executor = executor ?? throw new ArgumentNullException(nameof(executor));
    private readonly ILogger<AuthService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private const string CmplConnectionKey = "MySQLConnection_CMPL";
    private readonly string _cmplConnectionString = configuration.GetConnectionString(CmplConnectionKey) ?? throw new InvalidOperationException($"Connection string '{CmplConnectionKey}' not found in configuration.");

    public async Task<Result<UserDto>> AuthenticateAsync(LoginRequest req, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(req.Identifier) || string.IsNullOrWhiteSpace(req.Password))
        {
            return Result<UserDto>.Failure("Auth.ValidationError", "Credentials cannot be empty.");
        }

        try
        {
            _logger.LogInformation("Verifying credentials against compliance data cluster.");

            var complianceUser = await _executor.QueryFirstOrDefaultAsync<UserDto>(
                LoginQuery.AuthenticateComplianceUser,
                new { req.Identifier, req.Password },
                connectionString: _cmplConnectionString,
                cancellationToken: cancellationToken
            );

            if (complianceUser == null)
            {
                _logger.LogWarning("Authentication failed: Invalid credentials provided for identifier: {Identifier}", req.Identifier);
                return Result<UserDto>.Failure("Auth.InvalidCredentials", "Invalid username or password configuration.");
            }

            _logger.LogInformation("Credentials verified. Syncing profile permissions from core portal backend database.");

            var portalPermissions = await _executor.QueryFirstOrDefaultAsync<UserDto>(
                LoginQuery.GetPortalUserPermissions,
                new { UserId = complianceUser.UserId },
                cancellationToken: cancellationToken
            );

            if (portalPermissions == null)
            {
                _logger.LogWarning("Authentication rejected: Verified user ID {UserId} has no mapped portal record.", complianceUser.UserId);
                return Result<UserDto>.Failure("Auth.NoAccess", "Your identity exists but has not been granted portal user access roles.");
            }

            if (portalPermissions.IsActive == 0)
            {
                _logger.LogWarning("Authentication rejected: Mapped user account for ID {UserId} is inactive.", complianceUser.UserId);
                return Result<UserDto>.Failure("Auth.AccountInactive", "User profile has been marked inactive. Please contact Admin.");
            }

            portalPermissions.UserName = complianceUser.UserName;
            portalPermissions.EmpId = complianceUser.EmpId;
            portalPermissions.MailId = complianceUser.MailId;
            portalPermissions.MobNo = complianceUser.MobNo;
            portalPermissions.DeptId = complianceUser.DeptId;

            return Result<UserDto>.Success(portalPermissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled transaction error failed verifying login credentials for: {Identifier}", req.Identifier);
            return Result<UserDto>.Failure("Auth.ServerError", "An unexpected connection failure interrupted authentication services.");
        }
    }
}
