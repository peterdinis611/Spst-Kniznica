using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace SpstKniznica.Common.Data;

/// <summary>
/// Maps CLR types the way our SQLite-era EF migrations store them (TEXT / INTEGER)
/// so the same migrations can run under Npgsql without type mismatches.
/// </summary>
public static class SqliteLegacyStoreTypes
{
    public static readonly ValueConverter<DateTimeOffset, string> DateTimeOffsetRequired = new(
        value => value.ToString("O", CultureInfo.InvariantCulture),
        value => ParseDateTimeOffset(value));

    public static readonly ValueConverter<DateTimeOffset?, string?> DateTimeOffsetOptional = new(
        value => value.HasValue
            ? value.Value.ToString("O", CultureInfo.InvariantCulture)
            : null,
        value => string.IsNullOrWhiteSpace(value) ? null : ParseDateTimeOffset(value));

    public static readonly ValueConverter<bool, int> BoolAsInteger = new(
        value => value ? 1 : 0,
        value => value != 0);

    public static readonly ValueConverter<bool?, int?> BoolAsIntegerOptional = new(
        value => value.HasValue ? (value.Value ? 1 : 0) : null,
        value => value.HasValue ? value.Value != 0 : null);

    /// <summary>
    /// Apply TEXT/INTEGER store types for DateTimeOffset and bool when using Npgsql
    /// against SQLite-generated migrations. No-op for SQLite (provider already maps these).
    /// </summary>
    public static void ApplyForNpgsql(this ModelBuilder modelBuilder, DbContext db)
    {
        if (!SqliteGuidNormalize.IsNpgsql(db))
        {
            return;
        }

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTimeOffset))
                {
                    property.SetValueConverter(DateTimeOffsetRequired);
                    property.SetColumnType("TEXT");
                }
                else if (property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(DateTimeOffsetOptional);
                    property.SetColumnType("TEXT");
                }
                else if (property.ClrType == typeof(bool))
                {
                    property.SetValueConverter(BoolAsInteger);
                    property.SetColumnType("INTEGER");
                }
                else if (property.ClrType == typeof(bool?))
                {
                    property.SetValueConverter(BoolAsIntegerOptional);
                    property.SetColumnType("INTEGER");
                }
            }
        }
    }

    private static DateTimeOffset ParseDateTimeOffset(string value)
    {
        if (DateTimeOffset.TryParse(
                value.Trim(),
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var dto))
        {
            return dto;
        }

        throw new FormatException($"Invalid DateTimeOffset text '{value}'.");
    }
}
