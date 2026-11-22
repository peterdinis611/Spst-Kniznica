using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using AuthorService.DTOs;
using SpstKniznica.Caching;

namespace AuthorService.Services;

internal static class AuthorListCacheKey
{
    public static readonly TimeSpan Ttl = TimeSpan.FromSeconds(30);

    public static string Page(AuthorQueryFilter filter)
    {
        filter.Normalize();
        return CacheKeys.AuthorListPrefix + "p:" + Hash(Core(filter));
    }

    public static string Cursor(AuthorCursorFilter filter)
    {
        filter.Normalize();
        var cursor = string.IsNullOrWhiteSpace(filter.Cursor) ? "" : filter.Cursor.Trim();
        return CacheKeys.AuthorListPrefix + "c:" + Hash(Core(filter) + "\ncursor=" + cursor);
    }

    private static string Core(AuthorQueryFilter filter) =>
        string.Join(
            '\n',
            filter.Page.ToString(CultureInfo.InvariantCulture),
            filter.PageSize.ToString(CultureInfo.InvariantCulture),
            filter.SortBy.ToLowerInvariant(),
            filter.SortDir,
            filter.Search ?? "",
            Text(filter.Name),
            Text(filter.Nationality),
            filter.IsActive?.ToString() ?? "");

    private static string Text(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "" : value.Trim();

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
