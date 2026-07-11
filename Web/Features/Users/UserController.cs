using Microsoft.AspNetCore.Mvc;

namespace Server.Features.Users;

[ApiController]
[Route("api/[controller]")]
public class UserController(IUserService service, ILogger<UserController> logger) : ControllerBase
{
    private readonly IUserService _service = service ?? throw new ArgumentNullException(nameof(service));
    private readonly ILogger<UserController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    /// Get all user portal profiles with role and location info.
    /// </summary>
    [HttpGet("profiles")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserPortalProfiles(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Fetching all user portal profiles.");
            var result = await _service.GetUserPortalProfilesAsync(ct);

            if (result.IsFailure)
            {
                _logger.LogWarning("Failed to retrieve user portal profiles. Error: {ErrorCode} - {ErrorMessage}", result.Error.Code, result.Error.Message);
                return Problem(detail: result.Error.Message, statusCode: StatusCodes.Status400BadRequest);
            }

            return Ok(result.Value);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Log full exception stack details locally for engineers
            _logger.LogError(ex, "An unexpected error occurred while fetching user portal profiles.");

            // Mask raw internal database errors from public API clients
            return Problem(
                detail: "An internal server error occurred while retrieving profiles. Please try again later.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Get all HOD portal profiles with role and location info.
    /// </summary>
    [HttpGet("hod-profiles")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetHodPortalProfiles(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Fetching all HOD portal profiles.");
            var result = await _service.GetHodPortalProfilesAsync(ct);

            if (result.IsFailure)
            {
                _logger.LogWarning("Failed to retrieve HOD portal profiles. Error: {ErrorCode} - {ErrorMessage}", result.Error.Code, result.Error.Message);
                return Problem(detail: result.Error.Message, statusCode: StatusCodes.Status400BadRequest);
            }

            return Ok(result.Value);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "An unexpected error occurred while fetching HOD portal profiles.");
            return Problem(
                detail: "An internal server error occurred while retrieving HOD profiles.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Get a specific user portal profile with role and location info by User ID.
    /// </summary>
    [HttpGet("profiles/{id}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserPortalProfileById(string id, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid user ID block provided: {UserId}", id);
            return BadRequest(new ProblemDetails { Detail = "User ID must be greater than zero." });
        }

        try
        {
            _logger.LogInformation("Fetching portal profile for user ID: {UserId}", id);
            var result = await _service.GetUserPortalProfileIdAsync(id, ct);

            if (result.IsFailure)
            {
                _logger.LogWarning("Profile lookup failed for user ID: {UserId}. Error: {ErrorMessage}", id, result.Error.Message);
                return Problem(detail: result.Error.Message, statusCode: StatusCodes.Status404NotFound);
            }

            return Ok(result.Value);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Capture contextual data parameters to quickly debug production failures
            _logger.LogError(ex, "An unexpected error occurred while fetching profile for user ID: {UserId}", id);
            return Problem(
                detail: "An internal server error occurred while retrieving the requested profile.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Update an existing user's role and location details.
    /// </summary>
    [HttpPut("role")] // Route: PUT api/user/role
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUserRole(
        [FromBody] UpdateUserRoleRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(new ProblemDetails { Detail = "Payload body cannot be null." });
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            _logger.LogInformation("Processing role update request for User ID: {UserId} to Role: {Role}", request.UserId, request.Role);

            // Execute business service layer
            var result = await _service.UpdateUserRoleAsync(request, ct);

            if (result.IsFailure)
            {
                _logger.LogWarning("Failed to update role for user: {UserId}. Reason: {ErrorMessage}", request.UserId, result.Error.Message);

                // Map custom business logic error to specific HTTP code
                return result.Error.Code == "User.NotFound"
                    ? Problem(detail: result.Error.Message, statusCode: StatusCodes.Status404NotFound)
                    : Problem(detail: result.Error.Message, statusCode: StatusCodes.Status400BadRequest);
            }

            // Return a standard successful 204 NoContent status for resource updates
            return NoContent();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "An unexpected error occurred while modifying role for User ID: {UserId}", request.UserId);
            return Problem(
                detail: "An internal server error occurred while applying the profile update updates.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
}
