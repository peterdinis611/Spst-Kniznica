using SpstKniznica.Common.Pagination;

namespace SpstKniznica.Common.Export;

public static class ExportPaging
{
    public static async Task<List<TItem>> CollectAsync<TFilter, TItem>(
        TFilter filter,
        Func<TFilter, CancellationToken, Task<PagedResult<TItem>>> search,
        int maxTake,
        CancellationToken cancellationToken)
        where TFilter : PagedQuery
    {
        filter.Page = 1;
        filter.PageSize = PagedQuery.MaxPageSize;
        filter.Normalize();

        var all = new List<TItem>(Math.Min(maxTake, 256));
        while (all.Count < maxTake)
        {
            var page = await search(filter, cancellationToken);
            if (page.Items.Count == 0)
            {
                break;
            }

            var remaining = maxTake - all.Count;
            if (page.Items.Count <= remaining)
            {
                all.AddRange(page.Items);
            }
            else
            {
                all.AddRange(page.Items.Take(remaining));
            }

            if (all.Count >= page.TotalCount || page.Items.Count < filter.PageSize)
            {
                break;
            }

            filter.Page++;
        }

        return all;
    }
}
