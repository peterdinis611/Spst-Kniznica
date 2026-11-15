namespace SpstKniznica.Common.Pagination;

public class CursorQuery
{
    public const int DefaultLimit = 20;
    public const int MaxLimit = 100;

    public string? Cursor { get; set; }
    public int Limit { get; set; } = DefaultLimit;
    public string SortBy { get; set; } = "id";
    public string SortDir { get; set; } = "asc";
    public string? Search { get; set; }

    public bool IsDescending =>
        string.Equals(SortDir, "desc", StringComparison.OrdinalIgnoreCase);

    public void Normalize()
    {
        Limit = Math.Clamp(Limit <= 0 ? DefaultLimit : Limit, 1, MaxLimit);
        SortBy = string.IsNullOrWhiteSpace(SortBy) ? "id" : SortBy.Trim();
        SortDir = IsDescending ? "desc" : "asc";
        Search = string.IsNullOrWhiteSpace(Search) ? null : Search.Trim();
        Cursor = string.IsNullOrWhiteSpace(Cursor) ? null : Cursor.Trim();
    }

    public IReadOnlyDictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        if (Limit < 1 || Limit > MaxLimit)
        {
            errors["Limit"] = [$"Limit must be between 1 and {MaxLimit}."];
        }

        if (Cursor is not null && !CursorCodec.TryDecode(Cursor, out _))
        {
            errors["Cursor"] = ["Cursor is invalid."];
        }

        return errors.ToDictionary(
            pair => pair.Key,
            pair => pair.Value.ToArray(),
            StringComparer.OrdinalIgnoreCase);
    }
}
