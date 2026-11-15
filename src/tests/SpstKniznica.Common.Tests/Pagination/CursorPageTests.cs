using FluentAssertions;
using SpstKniznica.Common.Pagination;

namespace SpstKniznica.Common.Tests.Pagination;

public class CursorPageTests
{
    [Fact]
    public void Map_preserves_cursor_metadata_and_transforms_items()
    {
        var source = new CursorPage<int>
        {
            Items = [1, 2, 3],
            NextCursor = "abc",
            HasMore = true,
            Limit = 3,
        };

        var mapped = source.Map(x => $"n{x}");

        mapped.Items.Should().Equal("n1", "n2", "n3");
        mapped.NextCursor.Should().Be("abc");
        mapped.HasMore.Should().BeTrue();
        mapped.Limit.Should().Be(3);
    }

    [Fact]
    public void Map_handles_empty_page_without_cursor()
    {
        var source = new CursorPage<string>
        {
            Items = [],
            NextCursor = null,
            HasMore = false,
            Limit = 40,
        };

        var mapped = source.Map(x => x.Length);

        mapped.Items.Should().BeEmpty();
        mapped.NextCursor.Should().BeNull();
        mapped.HasMore.Should().BeFalse();
        mapped.Limit.Should().Be(40);
    }
}
