namespace SpstKniznica.Common.Text;

public static class StringNormalize
{
    public static string? Optional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static string Required(string value)
        => value.Trim();
}
