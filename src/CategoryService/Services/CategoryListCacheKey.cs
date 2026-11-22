using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using CategoryService.DTOs;
using SpstKniznica.Caching;

namespace CategoryService.Services;

internal static class CategoryListCacheKey
{
    public static readonly TimeSpan Ttl = TimeSpan.FromSeconds(30);

    public static string Page(CategoryQueryFilter filter)
    {
        filter.Normalize();
        return CacheKeys.CategoryListPrefix + "p:" + Hash(Core(filter));
    }

    public static string Cursor(CategoryCursorFilter filter)
    {
        filter.Normalize();
        var cursor = string.IsNullOrWhiteSpace(filter.Cursor) ? "" : filter.Cursor.Trim();
        return CacheKeys.CategoryListPrefix + "c:" + Hash(Core(filter) + "\ncursor=" + cursor);
    }

    private static string Core(CategoryQueryFilter filter) =>
        string.Join(
            '\n',
            filter.Page.ToString(CultureInfo.InvariantCulture),
            filter.PageSize.ToString(CultureInfo.InvariantCulture),
            filter.SortBy.ToLowerInvariant(),
            filter.SortDir,
            filter.Search ?? "",
            Text(filter.Name),
            filter.IsActive?.ToString() ?? "");

    private static string Text(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "" : value.Trim();

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}