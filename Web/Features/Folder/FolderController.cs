using Microsoft.AspNetCore.Mvc;

namespace Server.Features.Folder;

[ApiController]
[Route("api/[controller]")]
public class FolderController(IFolderService service, ILogger<FolderController> logger) : ControllerBase
{
    private readonly IFolderService _service = service ?? throw new ArgumentNullException(nameof(service));
    private readonly ILogger<FolderController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<FolderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        try
        {
            var result = await _service.GetAllAsync(ct);
            return result.IsSuccess ? Ok(result.Value) : Problem(result.Error.Message, statusCode: 400);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Fatal system error listing global folder parameters.");
            return Problem("An internal application runtime breakdown occurred.", statusCode: 500);
        }
    }

    [HttpGet("hod/{hodId}")]
    [ProducesResponseType(typeof(IEnumerable<FolderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByHod(string hodId, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetByHodIdAsync(hodId, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new ProblemDetails { Detail = result.Error.Message });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error processing filtered HOD lookups on element parameters.");
            return Problem("Error processing target payload entries.", statusCode: 500);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(int), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateFolderRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        try
        {
            var result = await _service.CreateAsync(request, ct);
            if (result.IsFailure) return Problem(result.Error.Message, statusCode: 400);

            return CreatedAtAction(nameof(GetAll), new { id = result.Value }, result.Value);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Failed creating tracking folder entry data sets mapping elements.");
            return Problem("Failed processing storage allocations context adjustments.", statusCode: 500);
        }
    }

    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromBody] UpdateFolderRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        try
        {
            var result = await _service.UpdateAsync(request, ct);

            if (result.IsFailure)
            {
                return result.Error.Code == "Folder.NotFound"
                    ? Problem(result.Error.Message, statusCode: 404)
                    : Problem(result.Error.Message, statusCode: 400);
            }

            return NoContent();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Unexpected error modifying folder parameters identifier trace map: {Id}", request.Id);
            return Problem("An unexpected pipeline exception broke runtime actions.", statusCode: 500);
        }
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SoftDelete(int id, [FromQuery] string modifiedBy, CancellationToken ct)
    {
        if (id <= 0 || string.IsNullOrWhiteSpace(modifiedBy))
            return BadRequest(new ProblemDetails { Detail = "Valid entry identification markers and tracking headers must be provided." });

        try
        {
            var result = await _service.SoftDeleteAsync(id, modifiedBy, ct);

            if (result.IsFailure)
            {
                return result.Error.Code == "Folder.NotFound"
                    ? Problem(result.Error.Message, statusCode: 404)
                    : Problem(result.Error.Message, statusCode: 400);
            }

            return NoContent();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error processing extraction routines for item tracking identification code: {Id}", id);
            return Problem("Failed modifying runtime state matrices profiles indices data fields.", statusCode: 500);
        }
    }

    /// <summary>
    /// Retrieves a completely dynamic, multi-layered nested hierarchy folder tree omitting network server IPs.
    /// </summary>
    [HttpGet("strict-hierarchy")]
    [ProducesResponseType(typeof(IEnumerable<FolderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetStrictFolderHierarchy(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Request received for dynamic nested folder hierarchy tree.");
            var result = await _service.GetStrictFolderHierarchyAsync(ct);

            if (result.IsFailure)
            {
                _logger.LogWarning("Failed to build folder hierarchy tree. Error: {ErrorCode} - {ErrorMessage}", result.Error.Code, result.Error.Message);
                return Problem(detail: result.Error.Message, statusCode: StatusCodes.Status400BadRequest);
            }

            return Ok(result.Value);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "An unexpected error occurred while generating strict folder tree hierarchy.");
            return Problem(
                detail: "An internal server error occurred while assembling the hierarchical directory tree.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Retrieves a distinct, single-level array containing only the top-level parent folder groupings.
    /// </summary>
    [HttpGet("parent-folders")]
    [ProducesResponseType(typeof(IEnumerable<FolderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetParentFolders(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Request received for distinct top-level parent folder arrays.");
            var result = await _service.GetParentFoldersAsync(ct);

            if (result.IsFailure)
            {
                _logger.LogWarning("Failed to retrieve top-level groups. Error: {ErrorCode} - {ErrorMessage}", result.Error.Code, result.Error.Message);
                return Problem(detail: result.Error.Message, statusCode: StatusCodes.Status400BadRequest);
            }

            return Ok(result.Value);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "An unexpected exception occurred while querying root parent categories.");
            return Problem(
                detail: "An internal database tracking error prevented locating root folder clusters.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
}
