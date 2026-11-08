using FluentValidation;

namespace BookService.Validators;

public static class BookValidationRules
{
    public static string? NormalizeIsbn(string? isbn)
    {
        if (string.IsNullOrWhiteSpace(isbn))
        {
            return null;
        }

        return new string(isbn.Where(c => c is not ('-' or ' ')).ToArray());
    }

    public static IRuleBuilderOptions<T, string?> ApplyIsbnFormat<T>(this IRuleBuilder<T, string?> rule)
    {
        return rule
            .MaximumLength(32)
            .Must(isbn =>
            {
                var normalized = NormalizeIsbn(isbn);
                return normalized is null || IsValidIsbn(normalized);
            })
            .WithMessage("ISBN must be a valid ISBN-10 or ISBN-13.");
    }

    public static IRuleBuilderOptions<T, int?> ApplyPublishedYear<T>(this IRuleBuilderInitial<T, int?> rule)
    {
        var maxYear = DateTime.UtcNow.Year + 1;
        return rule
            .Must(year => year is null || (year >= 1450 && year <= maxYear))
            .WithMessage($"Published year must be between 1450 and {maxYear}.");
    }

    private static bool IsValidIsbn(string value)
    {
        return System.Text.RegularExpressions.Regex.IsMatch(
            value,
            @"^(97[89]\d{10}|\d{9}[\dXx])$");
    }
}
