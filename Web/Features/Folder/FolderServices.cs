using Server.Common;
using Server.Features.DynamicQueryExecutor;

namespace Server.Features.Folder;

public sealed class FolderService(
    IDynamicQueryExecutor executor,
    ILogger<FolderService> logger) : IFolderService
{
    private readonly IDynamicQueryExecutor _executor = executor ?? throw new ArgumentNullException(nameof(executor));
    private readonly ILogger<FolderService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private const string DisplayTargetRoot = @"L:\Drive";

    // ═══════════════════════════════════════════════════════
    // READ OPERATIONS
    // ═══════════════════════════════════════════════════════

    public async Task<Result<IEnumerable<FolderDto>>> GetAllAsync(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Retrieving all active folder mappings.");
            var folders = await _executor.QueryAsync<FolderDto>(FolderQueries.GetAllFolders, cancellationToken: ct);
            return Result<IEnumerable<FolderDto>>.Success(folders ?? Enumerable.Empty<FolderDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database failure retrieving all folders.");
            return Result<IEnumerable<FolderDto>>.Failure("Database.Error", "Unable to load folder list map configurations.");
        }
    }

    public async Task<Result<IEnumerable<FolderDto>>> GetByHodIdAsync(string hodId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(hodId))
            return Result<IEnumerable<FolderDto>>.Failure("Validation.Error", "HOD Identifier reference value cannot be empty.");

        try
        {
            _logger.LogInformation("Filtering folders mapped for HOD Identifier: {HodId}", hodId);
            var folders = await _executor.QueryAsync<FolderDto>(
                FolderQueries.GetFoldersByHodId,
                new { HodId = hodId },
                cancellationToken: ct
            );
            return Result<IEnumerable<FolderDto>>.Success(folders ?? Enumerable.Empty<FolderDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database error filtering folders for HOD context reference: {HodId}", hodId);
            return Result<IEnumerable<FolderDto>>.Failure("Database.Error", "Unable to filter folder tracking metrics safely.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // WRITE OPERATIONS (CRUD)
    // ═══════════════════════════════════════════════════════

    public async Task<Result<int>> CreateAsync(CreateFolderRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.FolderName))
            return Result<int>.Failure("Validation.Error", "Folder display path context string is mandatory.");

        try
        {
            _logger.LogInformation("Inserting new folder item: {Name}", request.FolderName);
            var insertedId = await _executor.InsertAsync<int>(FolderQueries.InsertFolder, request, cancellationToken: ct);

            if (insertedId <= 0)
                return Result<int>.Failure("Database.InsertFailed", "The system was unable to safely record the entry.");

            return Result<int>.Success(insertedId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected storage failure compiling new folder mapping entry: {Name}", request.FolderName);
            return Result<int>.Failure("Database.Error", "Internal backend transaction error establishing map record.");
        }
    }

    public async Task<Result> UpdateAsync(UpdateFolderRequest request, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Updating folder mapping configurations for ID: {Id}", request.Id);

            var affected = await _executor.ExecuteAsync(
                FolderQueries.UpdateFolder,
                request,
                cancellationToken: ct
            );

            if (affected <= 0)
            {
                _logger.LogWarning("Folder mapping target reference key '{Id}' was not located.", request.Id);
                return Result.Failure("Folder.NotFound", $"Folder mapping reference ID '{request.Id}' was not found.");
            }

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database modification failure for folder sequence key: {Id}", request.Id);
            return Result.Failure("Database.Error", "Unable to modify folder configurations at this time.");
        }
    }

    public async Task<Result> SoftDeleteAsync(int id, string modifiedBy, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Processing soft-deletion request for folder key ID: {Id}", id);

            var affected = await _executor.ExecuteAsync(
                FolderQueries.SoftDeleteFolder,
                new { Id = id, ModifiedBy = modifiedBy },
                cancellationToken: ct
            );

            if (affected <= 0)
            {
                _logger.LogWarning("No active folder mapping records found to delete for ID: {Id}", id);
                return Result.Failure("Folder.NotFound", $"Target active folder identifier sequence '{id}' does not exist.");
            }

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Transaction exception while dropping folder instance: {Id}", id);
            return Result.Failure("Database.Error", "An unexpected failure occurred while deleting the folder mapping.");
        }
    }

    // ═══════════════════════════════════════════════════════
    // HIERARCHY TREE TREE PARSING OPERATIONS
    // ═══════════════════════════════════════════════════════

    public async Task<Result<IEnumerable<FolderResponse>>> GetStrictFolderHierarchyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching strict folder hierarchy from database.");

            var folderPaths = (await _executor.QueryAsync<string>(
                FolderQueries.GetParsedNtfsPermissionsAudit,
                cancellationToken: cancellationToken
            )).ToList();

            _logger.LogInformation("Retrieved {Count} distinct folder paths from query audit logs.", folderPaths.Count);

            if (!folderPaths.Any())
            {
                return Result<IEnumerable<FolderResponse>>.Success(Enumerable.Empty<FolderResponse>());
            }

            var allowedParentsMap = new Dictionary<string, FolderNode>(StringComparer.OrdinalIgnoreCase);

            foreach (var fullPath in folderPaths)
            {
                if (string.IsNullOrWhiteSpace(fullPath)) continue;

                var segments = fullPath.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries);

                // Example: "\\10.30.50.15\jipl\EDP\New" => segments: ["10.30.50.15", "jipl", "EDP", "New"]
                // Target parent is at index 2 ("EDP")
                if (segments.Length > 2)
                {
                    string parentName = segments[2];

                    if (!allowedParentsMap.TryGetValue(parentName, out var rootNode))
                    {
                        rootNode = new FolderNode
                        {
                            Name = parentName,
                            DriveName = DisplayTargetRoot
                        };
                        allowedParentsMap[parentName] = rootNode;
                    }

                    var currentNode = rootNode;
                    for (var i = 3; i < segments.Length; i++)
                    {
                        string segmentName = segments[i];

                        // Filter out dynamic files containing extensions (.txt, .xlsx)
                        if (segmentName.Contains('.')) continue;

                        if (!currentNode.Children.TryGetValue(segmentName, out var childNode))
                        {
                            childNode = new FolderNode
                            {
                                Name = segmentName,
                                DriveName = DisplayTargetRoot
                            };
                            currentNode.Children[segmentName] = childNode;
                        }
                        currentNode = childNode;
                    }
                }
            }

            var sortedHierarchy = allowedParentsMap.Values
                .OrderBy(x => x.Name)
                .Select(MapToResponse)
                .ToList();

            return Result<IEnumerable<FolderResponse>>.Success(sortedHierarchy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected exception building structural folder tree hierarchy.");
            return Result<IEnumerable<FolderResponse>>.Failure("Tree.BuildError", "Unable to assemble structural file matrices tree entries.");
        }
    }

    public async Task<Result<IEnumerable<FolderResponse>>> GetParentFoldersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching parent folders from audit records.");

            var paths = (await _executor.QueryAsync<string>(
                FolderQueries.GetParsedNtfsPermissionsAudit,
                cancellationToken: cancellationToken
            )).ToList();

            if (!paths.Any())
            {
                return Result<IEnumerable<FolderResponse>>.Success(Enumerable.Empty<FolderResponse>());
            }

            // Extract base level subfolder names (index 2 in split)
            var parents = paths
                .Where(path => !string.IsNullOrWhiteSpace(path))
                .Select(path => path.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries))
                .Where(segments => segments.Length > 2)
                .Select(segments => segments[2])
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(name => name)
                .Select(name => new FolderResponse
                {
                    Name = name,
                    DriveName = DisplayTargetRoot
                })
                .ToList();

            return Result<IEnumerable<FolderResponse>>.Success(parents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving top level parent groupings catalog collections.");
            return Result<IEnumerable<FolderResponse>>.Failure("Database.Error", "A processing exception prevented compiling root categories.");
        }
    }

    private FolderResponse MapToResponse(FolderNode node)
    {
        return new FolderResponse
        {
            Name = node.Name,
            DriveName = node.DriveName,
            Children = node.Children.Values
                .OrderBy(x => x.Name)
                .Select(MapToResponse)
                .ToList()
        };
    }
}
