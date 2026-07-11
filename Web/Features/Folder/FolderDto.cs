namespace Server.Features.Folder;

public class FolderDto
{
    public int Id { get; set; }
    public string FolderName { get; set; } = string.Empty;
    public string PrimaryHodId { get; set; } = string.Empty;
    public string? SecondaryHodId { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public bool IsActive { get; set; }
}

public class FolderNode
{
    public string Name { get; set; } = string.Empty;
    public string DriveName { get; set; } = string.Empty;
    public Dictionary<string, FolderNode> Children { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public class FolderResponse
{
    public string Name { get; set; } = string.Empty;
    public string DriveName { get; set; } = string.Empty;
    public List<FolderResponse> Children { get; set; } = new();
}


public record CreateFolderRequest(string FolderName, string PrimaryHodId, string? SecondaryHodId, string CreatedBy);
public record UpdateFolderRequest(int Id, string FolderName, string PrimaryHodId, string? SecondaryHodId, string ModifiedBy);
