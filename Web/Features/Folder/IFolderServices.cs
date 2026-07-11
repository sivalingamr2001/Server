using Server.Common;

namespace Server.Features.Folder;

public interface IFolderService
{
    Task<Result<IEnumerable<FolderDto>>> GetAllAsync(CancellationToken ct);

    Task<Result<IEnumerable<FolderDto>>> GetByHodIdAsync(string hodId, CancellationToken ct);

    Task<Result<int>> CreateAsync(CreateFolderRequest request, CancellationToken ct);

    Task<Result> UpdateAsync(UpdateFolderRequest request, CancellationToken ct);

    Task<Result> SoftDeleteAsync(int id, string modifiedBy, CancellationToken ct);

    Task<Result<IEnumerable<FolderResponse>>> GetStrictFolderHierarchyAsync(CancellationToken ct);

    Task<Result<IEnumerable<FolderResponse>>> GetParentFoldersAsync(CancellationToken ct);
}
