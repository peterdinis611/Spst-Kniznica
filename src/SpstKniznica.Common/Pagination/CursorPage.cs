namespace SpstKniznica.Common.Pagination;

public class CursorPage<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public string? NextCursor { get; init; }
    public bool HasMore { get; init; }
    public int Limit { get; init; }

    public CursorPage<TOut> Map<TOut>(Func<T, TOut> mapper) => new()
    {
        Items = Items.Select(mapper).ToList(),
        NextCursor = NextCursor,
        HasMore = HasMore,
        Limit = Limit,
    };
}
