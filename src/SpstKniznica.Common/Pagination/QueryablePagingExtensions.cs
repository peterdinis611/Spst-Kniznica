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
}
