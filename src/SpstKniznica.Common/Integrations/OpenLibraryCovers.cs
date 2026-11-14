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
        var digits = new string(isbn.Where(c => char.IsAsciiLetterOrDigit(c)).ToArray()).ToUpperInvariant();
        if (digits.Length is not (10 or 13)) return null;

        // ISBN-10 may end with X; otherwise only digits are valid.
        var body = digits.Length == 10 ? digits[..9] : digits;
        if (!body.All(char.IsAsciiDigit)) return null;
        if (digits.Length == 10 && !(char.IsAsciiDigit(digits[^1]) || digits[^1] == 'X')) return null;
        if (digits.Length == 13 && !digits.All(char.IsAsciiDigit)) return null;

        return digits;
    }
}
