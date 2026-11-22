using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using BookService.DTOs;
using SpstKniznica.Caching;

namespace BookService.Services;

internal static class BookListCacheKey
{
    public static readonly TimeSpan Ttl = TimeSpan.FromSeconds(20);

    public static string Page(BookQueryFilter filter)
    {
        filter.Normalize();
        return CacheKeys.BookListPrefix + "p:" + Hash(Core(filter));
    }

    public static string Cursor(BookCursorFilter filter)
    {
        filter.Normalize();
        var cursor = string.IsNullOrWhiteSpace(filter.Cursor) ? "" : filter.Cursor.Trim();
        return CacheKeys.BookListPrefix + "c:" + Hash(Core(filter) + "\ncursor=" + cursor);
    }

    /// <summary>Per book, under <see cref="CacheKeys.BookListPrefix"/> so copy updates drop it.</summary>
    public static string Summary(Guid id) =>
        CacheKeys.BookListPrefix + "s:" + id.ToString("D");

    private static string Core(BookQueryFilter filter)
    {
        return string.Join(
            '\n',
            filter.Page.ToString(CultureInfo.InvariantCulture),
            filter.PageSize.ToString(CultureInfo.InvariantCulture),
            filter.SortBy.ToLowerInvariant(),
            filter.SortDir,
            filter.Search ?? "",
            Text(filter.Title),
            GuidText(filter.AuthorId),
            Guids(filter.AuthorIds),
            Text(filter.Author),
            Text(filter.Publisher),
            Text(filter.Isbn),
            Text(filter.Language),
            GuidText(filter.CategoryId),
            Guids(filter.CategoryIds),
            Text(filter.CategoryName),
            Text(filter.ShelfLocation),
            filter.PublishedYear?.ToString(CultureInfo.InvariantCulture) ?? "",
            filter.PublishedYearFrom?.ToString(CultureInfo.InvariantCulture) ?? "",
            filter.PublishedYearTo?.ToString(CultureInfo.InvariantCulture) ?? "",
            filter.Format?.ToString() ?? "",
            filter.AvailableOnly?.ToString() ?? "",
            Text(filter.InventoryNumber),
            Text(filter.Barcode));
    }

    private static string Text(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "" : value.Trim();

    private static string GuidText(Guid? id) =>
        id is { } value && value != Guid.Empty ? value.ToString("D") : "";

    private static string Guids(IReadOnlyList<Guid>? ids)
    {
        if (ids is not { Count: > 0 })
        {
            return "";
        }

        return string.Join(
            ',',
            ids.Where(id => id != Guid.Empty)
                .Distinct()
                .OrderBy(id => id)
                .Select(id => id.ToString("D")));
    }

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
