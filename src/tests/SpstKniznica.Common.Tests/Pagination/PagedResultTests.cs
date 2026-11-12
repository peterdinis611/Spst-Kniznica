using FluentAssertions;
using SpstKniznica.Common.Pagination;

namespace SpstKniznica.Common.Tests.Pagination;

public class PagedResultTests
{
    [Fact]
    public void Computes_paging_metadata()
    {
        var result = new PagedResult<int>
        {
            Items = [1, 2],
            Page = 2,
            PageSize = 10,
            TotalCount = 25
        };

        result.TotalPages.Should().Be(3);
        result.HasPreviousPage.Should().BeTrue();
        result.HasNextPage.Should().BeTrue();
    }

    [Fact]
    public void Map_preserves_paging_and_transforms_items()
    {
        var source = new PagedResult<int>
        {
            Items = [1, 2, 3],
            Page = 1,
            PageSize = 10,
            TotalCount = 3
        };

        var mapped = source.Map(x => x * 2);

        mapped.Items.Should().Equal(2, 4, 6);
        mapped.Page.Should().Be(1);
        mapped.PageSize.Should().Be(10);
        mapped.TotalCount.Should().Be(3);
    }
}
