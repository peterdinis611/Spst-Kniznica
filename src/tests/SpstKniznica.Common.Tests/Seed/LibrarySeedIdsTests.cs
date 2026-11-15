using FluentAssertions;
using SpstKniznica.Common.Seed;

namespace SpstKniznica.Common.Tests.Seed;

public class LibrarySeedIdsTests
{
    [Fact]
    public void All_seed_guids_are_unique()
    {
        var ids = typeof(LibrarySeedIds)
            .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
            .Where(f => f.FieldType == typeof(Guid))
            .Select(f => (Guid)f.GetValue(null)!)
            .ToList();

        ids.Should().NotBeEmpty();
        ids.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void Seed_namespaces_use_stable_prefixes()
    {
        LibrarySeedIds.CategoryEkonomika.ToString().Should().StartWith("a1111111-");
        LibrarySeedIds.AuthorHousel.ToString().Should().StartWith("b2222222-");
        LibrarySeedIds.BookPsychMoney.ToString().Should().StartWith("c3333333-");
        LibrarySeedIds.BookingPsychMoneyActive.ToString().Should().StartWith("d4444444-");
    }

    [Fact]
    public void Has_expected_minimum_catalog_coverage()
    {
        var fields = typeof(LibrarySeedIds)
            .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
            .Where(f => f.FieldType == typeof(Guid))
            .Select(f => f.Name)
            .ToList();

        fields.Count(n => n.StartsWith("Category", StringComparison.Ordinal)).Should().BeGreaterThanOrEqualTo(12);
        fields.Count(n => n.StartsWith("Author", StringComparison.Ordinal)).Should().BeGreaterThanOrEqualTo(30);
        fields.Count(n => n.StartsWith("Book", StringComparison.Ordinal)).Should().BeGreaterThanOrEqualTo(48);
        fields.Count(n => n.StartsWith("Booking", StringComparison.Ordinal)).Should().Be(4);
    }
}
