namespace SpstKniznica.Common.Integrations;

public static class OpenLibraryCovers
{
    public static string? ForIsbn(string? isbn, char size = 'L')
    {
        var normalized = NormalizeIsbn(isbn);
        if (normalized is null) return null;
        var s = size is 'S' or 'M' or 'L' ? size : 'L';
        return $"https://covers.openlibrary.org/b/isbn/{normalized}-{s}.jpg";
    }

    public static string? NormalizeIsbn(string? isbn)
    {
        if (string.IsNullOrWhiteSpace(isbn)) return null;
        var digits = new string(isbn.Where(c => char.IsAsciiLetterOrDigit(c)).ToArray());
        return digits.Length is 10 or 13 ? digits.ToUpperInvariant() : null;
    }
}
