namespace BookService.DTOs;

public class BulkImportResult
{
    public int TotalRows { get; set; }
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
    public IReadOnlyList<BulkImportError> Errors { get; set; } = [];
}

public class BulkImportError
{
    public int RowNumber { get; set; }
    public string Message { get; set; } = string.Empty;
}
