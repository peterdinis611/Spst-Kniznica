using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

namespace SpstKniznica.Common.Pagination;

public static class QueryablePagingExtensions
{
    public static IQueryable<T> OrderByProperty<T>(
        this IQueryable<T> query,
        string? sortBy,
        bool descending,
        IReadOnlyDictionary<string, Expression<Func<T, object>>> sortMap,
        Expression<Func<T, object>> defaultSort)
    {
        var keyName = string.IsNullOrWhiteSpace(sortBy) ? string.Empty : sortBy.Trim().ToLowerInvariant();
        var key = sortMap.TryGetValue(keyName, out var selected) ? selected : defaultSort;
        return descending ? query.OrderByDescending(key) : query.OrderBy(key);
    }

    public static IOrderedQueryable<T> OrderByPropertyThenById<T>(
        this IQueryable<T> query,
        string? sortBy,
        bool descending,
        IReadOnlyDictionary<string, Expression<Func<T, object>>> sortMap,
        Expression<Func<T, object>> defaultSort,
        Expression<Func<T, Guid>> idSelector)
    {
        var keyName = string.IsNullOrWhiteSpace(sortBy) ? string.Empty : sortBy.Trim().ToLowerInvariant();
        var key = sortMap.TryGetValue(keyName, out var selected) ? selected : defaultSort;
        return descending
            ? query.OrderByDescending(key).ThenByDescending(idSelector)
            : query.OrderBy(key).ThenBy(idSelector);
    }

    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        PagedQuery paging,
        CancellationToken cancellationToken = default)
    {
        paging.Normalize();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((paging.Page - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>
        {
            Items = items,
            Page = paging.Page,
            PageSize = paging.PageSize,
            TotalCount = totalCount
        };
    }

    public static async Task<CursorPage<T>> ToCursorPageAsync<T>(
        this IQueryable<T> query,
        int limit,
        Func<T, Guid> idSelector,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit <= 0 ? CursorQuery.DefaultLimit : limit, 1, CursorQuery.MaxLimit);
        var batch = await query.Take(limit + 1).ToListAsync(cancellationToken);
        var hasMore = batch.Count > limit;
        if (hasMore)
        {
            batch = batch.Take(limit).ToList();
        }

        string? nextCursor = null;
        if (hasMore && batch.Count > 0)
        {
            nextCursor = CursorCodec.Encode(idSelector(batch[^1]));
        }

        return new CursorPage<T>
        {
            Items = batch,
            NextCursor = nextCursor,
            HasMore = hasMore,
            Limit = limit,
        };
    }
}
