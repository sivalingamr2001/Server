using Server.Common;
using Server.Features.DynamicQueryExecutor;

namespace Server.Features.Users;

public sealed class UserService(
    IDynamicQueryExecutor executor,
    ILogger<UserService> logger,
    IConfiguration configuration) : IUserService
{
    private readonly IDynamicQueryExecutor _executor = executor ?? throw new ArgumentNullException(nameof(executor));
    private readonly ILogger<UserService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public const string CmplConnectionKey = "MySQLConnection_CMPL";
    private readonly string _cmplConnectionString = configuration.GetConnectionString(CmplConnectionKey) ?? throw new InvalidOperationException($"Connection string '{CmplConnectionKey}' not found in configuration.");

    // ═══════════════════════════════════════════════════════
    // GET ALL PROFILES
    // ═══════════════════════════════════════════════════════
    public async Task<Result<IEnumerable<UserDto>>> GetUserPortalProfilesAsync(CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Fetching base portal data from default database connection.");

            // 1. Fetch portal users directly into UserDto using alias SQL naming layouts
            var portalUsers = (await _executor.QueryAsync<UserDto>(
                UserQueries.GetPortalUsersBase,
                cancellationToken: ct
            )).ToList();

            if (!portalUsers.Any())
            {
                return Result<IEnumerable<UserDto>>.Success(Enumerable.Empty<UserDto>());
            }

            // 2. Extract distinct integer IDs to query the compliance system
            var userIds = portalUsers.Select(x => x.UserId).Distinct().ToList();

            _logger.LogInformation("Fetching mapping compliance columns from connection: {Connection}", CmplConnectionKey);

            // 3. Query the compliance database using the explicitly named connection overload
            var complianceUsers = (await _executor.QueryAsync<UserDto>(
                UserQueries.GetComplianceUsersByIds,
                connectionName: CmplConnectionKey,
                parameters: new { Ids = userIds },
                cancellationToken: ct
            )).ToDictionary(x => x.UserId);

            // 4. Merge cross-database structures cleanly in-memory
            var combinedProfiles = portalUsers.Select(portal =>
            {
                complianceUsers.TryGetValue(portal.UserId, out var cmpl);
                return MergeUserProperties(portal, cmpl);
            });

            return Result<IEnumerable<UserDto>>.Success(combinedProfiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed combining multi-source datasets in user profiles query sequence.");
            return Result<IEnumerable<UserDto>>.Failure("Database.Error", "An error occurred assembling data segments across active database systems.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // GET HOD PROFILES
    // ═══════════════════════════════════════════════════════
    public async Task<Result<IEnumerable<UserDto>>> GetHodPortalProfilesAsync(CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Fetching HOD records from core system profile tracker database.");

            // 1. Fetch filtered role elements directly into UserDto patterns
            var portalHods = (await _executor.QueryAsync<UserDto>(
                UserQueries.GetPortalUsersByRole,
                new { Role = "Hod" },
                cancellationToken: ct
            )).ToList();

            if (!portalHods.Any())
            {
                return Result<IEnumerable<UserDto>>.Success(Enumerable.Empty<UserDto>());
            }

            var hodIds = portalHods.Select(x => x.UserId).Distinct().ToList();

            _logger.LogInformation("Resolving corresponding employee system identities via connection: {Connection}", CmplConnectionKey);

            var complianceData = (await _executor.QueryAsync<UserDto>(
                UserQueries.GetComplianceUsersByIds,
                connectionName: CmplConnectionKey,
                parameters: new { Ids = hodIds },
                cancellationToken: ct
            )).ToDictionary(x => x.UserId);

            var hodProfiles = portalHods.Select(portal =>
            {
                complianceData.TryGetValue(portal.UserId, out var cmpl);
                return MergeUserProperties(portal, cmpl);
            });

            return Result<IEnumerable<UserDto>>.Success(hodProfiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed structural mapping for HOD identities profile queries.");
            return Result<IEnumerable<UserDto>>.Failure("Database.Error", "An unexpected failure occurred querying the target datasets.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // GET PROFILE BY ID
    // ═══════════════════════════════════════════════════════
    public async Task<Result<UserDto>> GetUserPortalProfileIdAsync(string id, CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return Result<UserDto>.Failure("Validation.Error", "ID cannot be empty.");
            }

            _logger.LogInformation("Fetching compliance user profile for ID: {SearchId}", id);

            var complianceUser = await _executor.QueryFirstOrDefaultAsync<UserDto>(
                UserQueries.GetComplianceUsersById,
                connectionString: _cmplConnectionString,
                parameters: new { Id = id.Trim() },
                cancellationToken: ct
            );

            if (complianceUser == null)
            {
                _logger.LogWarning("No records found in compliance database for ID: {SearchId}", id);
                return Result<UserDto>.Failure("User.NotFound", "User profile not found.");
            }

            var portalUser = await _executor.QueryFirstOrDefaultAsync<UserDto>(
                UserQueries.GetPortalUserById,
                parameters: new { Id = complianceUser.UserId },
                cancellationToken: ct
            );

            var combinedProfile = MergeUserProperties(portalUser ?? new UserDto { UserId = complianceUser.UserId }, complianceUser);

            return Result<UserDto>.Success(combinedProfile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed combining multi-source datasets in single user profile query sequence.");
            return Result<UserDto>.Failure("Database.Error", "An error occurred assembling data segments across active database systems.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE ROLE
    // ═══════════════════════════════════════════════════════
    public async Task<Result> UpdateUserRoleAsync(UpdateUserRoleRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return Result.Failure("Validation.Error", "A valid User identity key string must be supplied.");
        }

        try
        {
            _logger.LogInformation("Executing database update configuration for user: {UserId}", request.UserId);

            var rowsAffected = await _executor.ExecuteAsync(
                UserQueries.UpdateUserPortalProfile,
                new
                {
                    Id = request.UserId,
                    Role = request.Role.ToString(),
                    Location = request.Location ?? (object)DBNull.Value
                },
                cancellationToken: ct
            );

            if (rowsAffected <= 0)
            {
                _logger.LogWarning("No DB database matching entry found during role manipulation attempt for context identifier: {UserId}", request.UserId);
                return Result.Failure("User.NotFound", $"The user element target code parameter identity value '{request.UserId}' does not exist.");
            }

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Persistence runtime execution context failure trying to alter state schema boundaries on User ID: {UserId}", request.UserId);
            return Result.Failure("Database.Error", "The repository storage block was unable to apply context modifications successfully.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // HELPER IN-MEMORY STITCHER
    // ═══════════════════════════════════════════════════════
    private static UserDto MergeUserProperties(UserDto portal, UserDto? cmpl)
    {
        // Hydrate portal object fields using the aliased details pulled from the secondary database
        portal.UserName = cmpl?.UserName ?? "Unknown Name";
        portal.EmpId = cmpl?.EmpId;
        portal.MailId = cmpl?.MailId;
        portal.MobNo = cmpl?.MobNo;
        portal.DeptId = cmpl?.DeptId;

        return portal;
    }
}
