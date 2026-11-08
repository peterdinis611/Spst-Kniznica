namespace SpstKniznica.Common.Pagination;

public class PagedResult<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;

    public PagedResult<TOut> Map<TOut>(Func<T, TOut> mapper) => new()
    {
        Items = Items.Select(mapper).ToList(),
        Page = Page,
        PageSize = PageSize,
        TotalCount = TotalCount
    };
}
