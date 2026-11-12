using FluentAssertions;
using SpstKniznica.Common.Pagination;

namespace SpstKniznica.Common.Tests.Pagination;

public class PagedQueryTests
{
    [Fact]
    public void Normalize_clamps_and_trims_values()
    {
        var query = new PagedQuery
        {
            Page = 0,
            PageSize = 500,
            SortBy = "  title ",
            SortDir = "DESC",
            Search = "  motor  "
        };

        query.Normalize();

        query.Page.Should().Be(1);
        query.PageSize.Should().Be(PagedQuery.MaxPageSize);
        query.SortBy.Should().Be("title");
        query.SortDir.Should().Be("desc");
        query.IsDescending.Should().BeTrue();
        query.Search.Should().Be("motor");
    }

    [Fact]
    public void Normalize_replaces_blank_search_and_sort()
    {
        var query = new PagedQuery
        {
            Page = 2,
            PageSize = 0,
            SortBy = "   ",
            SortDir = "sideways",
            Search = "   "
        };

        query.Normalize();

        query.PageSize.Should().Be(PagedQuery.DefaultPageSize);
        query.SortBy.Should().Be("id");
        query.SortDir.Should().Be("asc");
        query.Search.Should().BeNull();
    }

    [Fact]
    public void Validate_reports_page_and_page_size_errors()
    {
        var query = new PagedQuery { Page = 0, PageSize = 250 };

        var errors = query.Validate();

        errors.Should().ContainKey("Page");
        errors.Should().ContainKey("PageSize");
    }

    [Fact]
    public void Validate_accepts_normalized_bounds()
    {
        var query = new PagedQuery { Page = 1, PageSize = 20 };
        query.Validate().Should().BeEmpty();
    }
}
