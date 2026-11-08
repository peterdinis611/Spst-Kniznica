namespace SpstKniznica.Common.Pagination;

public class PagedQuery
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = DefaultPageSize;
    public string SortBy { get; set; } = "id";
    public string SortDir { get; set; } = "asc";
    public string? Search { get; set; }

    public bool IsDescending =>
        string.Equals(SortDir, "desc", StringComparison.OrdinalIgnoreCase);

    public void Normalize()
    {
        Page = Math.Max(Page, 1);
        PageSize = Math.Clamp(PageSize <= 0 ? DefaultPageSize : PageSize, 1, MaxPageSize);
        SortBy = string.IsNullOrWhiteSpace(SortBy) ? "id" : SortBy.Trim();
        SortDir = IsDescending ? "desc" : "asc";
        Search = string.IsNullOrWhiteSpace(Search) ? null : Search.Trim();
    }

    public IReadOnlyDictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        if (Page < 1)
        {
            errors["Page"] = ["Page must be greater than or equal to 1."];
        }

        if (PageSize < 1 || PageSize > MaxPageSize)
        {
            errors["PageSize"] = [$"PageSize must be between 1 and {MaxPageSize}."];
        }

        return errors.ToDictionary(
            pair => pair.Key,
            pair => pair.Value.ToArray(),
            StringComparer.OrdinalIgnoreCase);
    }
}
