using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Server.Common;

namespace Server.Features.AccessRequest;

/// <summary>
/// Manages access requests and their lifecycle (CRUD + workflow operations)
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[EnableRateLimiting("fixed")]
public class AccessRequestController : ControllerBase
{
    private readonly IAccessRequestService _service;
    private readonly ILogger<AccessRequestController> _logger;

    public AccessRequestController(
        IAccessRequestService service,
        ILogger<AccessRequestController> logger)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Fetch real-time aggregated metrics for the dashboard view
    /// </summary>
    [HttpGet("dashboard-metrics")]
    [ProducesResponseType(typeof(AccessDashboardMetricsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDashboardMetrics(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Fetching access request real-time dashboard analytics.");
            var metrics = await _service.GetDashboardMetricsAsync(ct);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compile background pipeline analytics metrics.");
            return StatusCode(StatusCodes.Status500InternalServerError, "Error processing analytics view.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════

    /// <summary>
    /// Create a new access request with associated items
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AccessRequestResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAccessRequestWithItemsDto dto,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var result = await _service.CreateAsync(dto, ct);

        if (result.IsFailure)
            return ConflictProblem(result.Error.Message);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Value.Id },
            result.Value);
    }

    // ═══════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════

    /// <summary>
    /// Get all active access requests and items submitted by a specific user ID
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(List<AccessRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllByUserId(string userId, CancellationToken ct)
    {
        var result = await _service.GetAllRequestsByUserIdAsync(userId, ct);

        if (result.IsFailure)
            return BadRequestProblem(result.Error.Message);

        return Ok(result.Value);
    }

    /// <summary>
    /// Get all pending or config-matched access requests for a specific HOD
    /// </summary>
    [HttpGet("hod/{hodUserId}")]
    [ProducesResponseType(typeof(List<AccessRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByHod(string hodUserId, CancellationToken ct)
    {
        var result = await _service.GetRequestsByHodAsync(hodUserId, ct);

        if (result.IsFailure)
            return BadRequestProblem(result.Error.Message);

        return Ok(result.Value);
    }

    /// <summary>
    /// Get all active access request items inside the IT Operator fulfillment queue
    /// </summary>
    [HttpGet("operator")]
    [ProducesResponseType(typeof(List<AccessRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetOperatorQueue(CancellationToken ct)
    {
        var result = await _service.GetRequestsByOperatorAsync(ct);

        if (result.IsFailure)
        {
            // Fix CS0103: Use the native framework Problem helper with StatusCode 500
            return Problem(
                detail: result.Error.Message,
                statusCode: StatusCodes.Status500InternalServerError);
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Get a single access request by ID with all items
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AccessRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);

        if (result.IsFailure)
            return NotFoundProblem($"Access request with ID {id} not found");

        return Ok(result.Value);
    }

    /// <summary>
    /// Get the complete access request details and all related sibling items by a single Item ID
    /// </summary>
    [HttpGet("item/{id:int}")]
    [ProducesResponseType(typeof(AccessRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByItemId(int id, CancellationToken ct)
    {
        var result = await _service.GetByItemIdAsync(id, ct);

        if (result.IsFailure)
            return NotFoundProblem($"Access request with ID {id} not found");

        return Ok(result.Value);
    }

    [HttpGet("get-hodby-folderpath")]
    public async Task<Result<HodConfigurationDto>> GetHodByFolderPath(
    string folderPath,
    CancellationToken ct = default)
    {
        var result = await _service.GetHodByFolderPathAsync(folderPath, ct);

        if (result.IsFailure)
        {
            return Result<HodConfigurationDto>.Failure(result.Error.Code, result.Error.Message);
        }

        // Convert the tuple from the service into the JSON-serializable DTO
        var (primary, secondary) = result.Value;
        var dto = new HodConfigurationDto(primary, secondary);

        return Result<HodConfigurationDto>.Success(dto);
    }

    /// <summary>
    /// Get items for a specific access request
    /// </summary>
    [HttpGet("{requestId:int}/items")]
    [ProducesResponseType(typeof(IReadOnlyList<AccessItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetItemsByRequestId(int requestId, CancellationToken ct)
    {
        var result = await _service.GetItemsByRequestIdAsync(requestId, ct);

        if (result.IsFailure)
            return NotFoundProblem($"Access request with ID {requestId} not found");

        return Ok(result.Value);
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE (Workflow Operations)
    // ═══════════════════════════════════════════════════════

    /// <summary>
    /// Update an access item's details (before approval)
    /// </summary>
    [HttpPut("items/{itemId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateItem(
        int itemId,
        [FromBody] UpdateAccessItemDto dto,
        CancellationToken ct)
    {
        if (dto.AccessItemId != itemId)
            return ValidationProblem(
                detail: "Route ID does not match body ID",
                modelStateDictionary: null);

        var result = await _service.UpdateItemAsync(dto, ct);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "NotFound" => NotFoundProblem(result.Error.Message),
                "InvalidState" => ConflictProblem(result.Error.Message),
                _ => BadRequestProblem(result.Error.Message)
            };
        }

        return NoContent();
    }

    /// <summary>
    /// HOD approves or rejects an access item
    /// </summary>
    [HttpPost("items/{itemId:int}/hod-decision")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> HodDecision(
        int itemId,
        [FromBody] HodApproveOrRejectDto dto,
        CancellationToken ct)
    {
        if (dto.AccessItemId != itemId)
            return ValidationProblem(
                detail: "Route ID does not match body ID",
                modelStateDictionary: null);

        if (dto.Status is not (AccessItemStatus.HodApproved or AccessItemStatus.HodRejected))
            return ValidationProblem(
                detail: "Status must be HodApproved or HodRejected",
                modelStateDictionary: null);

        var result = await _service.HodDecisionAsync(dto, GetCurrentUserId(), ct);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "NotFound" => NotFoundProblem(result.Error.Message),
                "InvalidState" => ConflictProblem(result.Error.Message),
                _ => BadRequestProblem(result.Error.Message)
            };
        }

        return NoContent();
    }

    /// <summary>
    /// Operator approves or rejects an access item
    /// </summary>
    [HttpPost("items/{itemId:int}/operator-decision")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> OperatorDecision(
        int itemId,
        [FromBody] OperatorApproveOrRejectDto dto,
        CancellationToken ct)
    {
        if (dto.AccessItemId != itemId)
            return ValidationProblem(
                detail: "Route ID does not match body ID",
                modelStateDictionary: null);

        if (dto.Status is not (AccessItemStatus.OperatorApproved or AccessItemStatus.OperatorRejected))
            return ValidationProblem(
                detail: "Status must be OperatorApproved or OperatorRejected",
                modelStateDictionary: null);

        var result = await _service.OperatorDecisionAsync(dto, GetCurrentUserId(), ct);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "NotFound" => NotFoundProblem(result.Error.Message),
                "InvalidState" => ConflictProblem(result.Error.Message),
                _ => BadRequestProblem(result.Error.Message)
            };
        }

        return NoContent();
    }

    /// <summary>
    /// Renew an existing access item
    /// </summary>
    [HttpPost("items/{itemId:int}/renew")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Renew(
        int itemId,
        [FromBody] AccessRequestRenewalDto dto,
        CancellationToken ct)
    {
        if (dto.AccessItemId != itemId)
            return ValidationProblem(
                detail: "Route ID does not match body ID",
                modelStateDictionary: null);

        var result = await _service.RenewAsync(dto, GetCurrentUserId(), ct);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "NotFound" => NotFoundProblem(result.Error.Message),
                "InvalidState" => ConflictProblem(result.Error.Message),
                _ => BadRequestProblem(result.Error.Message)
            };
        }

        return NoContent();
    }

    /// <summary>
    /// Revoke an active access item
    /// </summary>
    [HttpPost("items/{itemId:int}/revoke")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Revoke(
        int itemId,
        [FromBody] AccessRequestRevokeDto dto,
        CancellationToken ct)
    {
        if (dto.AccessItemId != itemId)
            return ValidationProblem(
                detail: "Route ID does not match body ID",
                modelStateDictionary: null);

        var result = await _service.RevokeAsync(dto, GetCurrentUserId(), ct);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "NotFound" => NotFoundProblem(result.Error.Message),
                "InvalidState" => ConflictProblem(result.Error.Message),
                _ => BadRequestProblem(result.Error.Message)
            };
        }

        return NoContent();
    }

    // ═══════════════════════════════════════════════════════
    // DELETE (Soft Delete)
    // ═══════════════════════════════════════════════════════

    /// <summary>
    /// Soft delete an access item
    /// </summary>
    [HttpDelete("items/{itemId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SoftDeleteItem(
        int itemId,
        [FromBody] DeleteAccessItemDto dto,
        CancellationToken ct)
    {
        if (dto.AccessItemId != itemId)
            return ValidationProblem(
                detail: "Route ID does not match body ID",
                modelStateDictionary: null);

        var result = await _service.SoftDeleteItemAsync(dto, ct);

        if (result.IsFailure)
            return NotFoundProblem(result.Error.Message);

        return NoContent();
    }

    /// <summary>
    /// Soft delete an entire access request and all its items
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SoftDeleteRequest(int id, CancellationToken ct)
    {
        var result = await _service.SoftDeleteRequestAsync(id, GetCurrentUserId(), ct);

        if (result.IsFailure)
            return NotFoundProblem(result.Error.Message);

        return NoContent();
    }

    // ═══════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════

    private string GetCurrentUserId()
    {
        return User.Identity?.Name ?? "system";
    }

    private IActionResult NotFoundProblem(string detail) =>
        Problem(
            detail: detail,
            statusCode: StatusCodes.Status404NotFound,
            title: "Not Found");

    private IActionResult ConflictProblem(string detail) =>
        Problem(
            detail: detail,
            statusCode: StatusCodes.Status409Conflict,
            title: "Conflict");

    private IActionResult BadRequestProblem(string detail) =>
        Problem(
            detail: detail,
            statusCode: StatusCodes.Status400BadRequest,
            title: "Bad Request");
}
