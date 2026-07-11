using Microsoft.AspNetCore.Mvc;

namespace Server.Features.Auth;

/// <summary>
/// Handles authentication requests, processing secure user login operations and credential validations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController(ILogger<AuthController> logger, IAuthService authService) : ControllerBase
{
    private readonly ILogger<AuthController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IAuthService _authService = authService ?? throw new ArgumentNullException(nameof(authService));

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(new ProblemDetails { Detail = "Payload payload body cannot be null." });
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            _logger.LogInformation("Processing login request processing mechanics for identifier: {Identifier}", request.Identifier);

            var result = await _authService.AuthenticateAsync(request, ct);

            if (result.IsFailure)
            {
                _logger.LogWarning("Failed login attempt for identifier: {Identifier}. Reason: {ErrorCode}", request.Identifier, result.Error.Code);

                if (result.Error.Code == "Auth.InvalidCredentials")
                {
                    return Unauthorized(new ProblemDetails { Detail = result.Error.Message });
                }

                return BadRequest(new ProblemDetails { Detail = result.Error.Message });
            }

            var user = result.Value;

            if (!string.IsNullOrWhiteSpace(user.Role))
            {
                user.Role = user.Role.ToLowerInvariant();
            }

            return Ok(new
            {
                IsAuthenticated = true,
                CurrentUser = user,
                CurrentUserRole = user.Role
            });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "A fatal application breakdown disrupted authentication processing targets for identifier: {Identifier}", request.Identifier);
            return Problem(
                detail: "An internal server error occurred while validation credentials processing.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
}
