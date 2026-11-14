using FluentAssertions;
using SpstKniznica.Common.Export;
using SpstKniznica.Common.Pagination;

namespace SpstKniznica.Common.Tests.Export;

public class ExportPagingTests
{
    [Fact]
    public async Task CollectAsync_aggregates_pages_up_to_take()
    {
        var filter = new PagedQuery();
        var calls = 0;

        var items = await ExportPaging.CollectAsync(
            filter,
            (f, _) =>
            {
                calls++;
                var pageItems = Enumerable.Range((f.Page - 1) * 100 + 1, 100)
                    .Select(i => $"row-{i}")
                    .ToList();
                return Task.FromResult(new PagedResult<string>
                {
                    Items = pageItems,
                    Page = f.Page,
                    PageSize = f.PageSize,
                    TotalCount = 250,
                });
            },
            maxTake: 150,
            CancellationToken.None);

        items.Should().HaveCount(150);
        items.First().Should().Be("row-1");
        items.Last().Should().Be("row-150");
        calls.Should().Be(2);
        filter.PageSize.Should().Be(PagedQuery.MaxPageSize);
    }

    [Fact]
    public async Task CollectAsync_stops_when_exhausted()
    {
        var filter = new PagedQuery();
        var items = await ExportPaging.CollectAsync(
            filter,
            (_, _) => Task.FromResult(new PagedResult<string>
            {
                Items = ["a", "b"],
                Page = 1,
                PageSize = 100,
                TotalCount = 2,
            }),
            maxTake: 500,
            CancellationToken.None);

        items.Should().Equal("a", "b");
    }
}
