using FluentAssertions;
using SpstKniznica.Common.Pagination;

namespace SpstKniznica.Common.Tests.Pagination;

public class CursorQueryTests
{
    [Fact]
    public void Normalize_clamps_limit_and_trims()
    {
        var query = new CursorQuery
        {
            Limit = 500,
            SortBy = "  title ",
            SortDir = "DESC",
            Search = "  motor  ",
            Cursor = "  abc  ",
        };

        query.Normalize();

        query.Limit.Should().Be(CursorQuery.MaxLimit);
        query.SortBy.Should().Be("title");
        query.SortDir.Should().Be("desc");
        query.Search.Should().Be("motor");
        query.Cursor.Should().Be("abc");
    }

    [Fact]
    public void Validate_rejects_invalid_cursor()
    {
        var query = new CursorQuery { Limit = 20, Cursor = "%%%" };
        var errors = query.Validate();
        errors.Should().ContainKey("Cursor");
    }
}
