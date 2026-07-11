using Server.Common;
using Server.Features.Users;

namespace Server.Features.Auth;

public interface IAuthService
{
    Task<Result<UserDto>> AuthenticateAsync(LoginRequest req, CancellationToken cancellationToken = default);
}
