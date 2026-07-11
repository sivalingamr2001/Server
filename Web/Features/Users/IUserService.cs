using Server.Common;

namespace Server.Features.Users;

public interface IUserService
{
    Task<Result<IEnumerable<UserDto>>> GetUserPortalProfilesAsync(CancellationToken ct);

    Task<Result<IEnumerable<UserDto>>> GetHodPortalProfilesAsync(CancellationToken ct);

    Task<Result<UserDto>> GetUserPortalProfileIdAsync(string id, CancellationToken ct);

    Task<Result> UpdateUserRoleAsync(UpdateUserRoleRequest request, CancellationToken ct);
}
