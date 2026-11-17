using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace SpstKniznica.Common.Data;

/// <summary>
/// Store GUIDs as lowercase TEXT ("D" format) so SQLite lookups match <see cref="Guid.ToString()"/>.
/// </summary>
public static class SqliteGuidConverters
{
    public static readonly ValueConverter<Guid, string> Required = new(
        guid => guid.ToString("D"),
        value => Parse(value));

    public static readonly ValueConverter<Guid?, string?> Optional = new(
        guid => guid.HasValue ? guid.Value.ToString("D") : null,
        value => string.IsNullOrWhiteSpace(value) ? null : Parse(value));

    public static Guid Parse(string value)
    {
        if (Guid.TryParse(value.Trim(), out var guid))
        {
            return guid;
        }

        throw new FormatException($"Invalid GUID text '{value}'.");
    }

    /// <summary>
    /// Apply lowercase-TEXT conversion to every Guid / Guid? property on the model.
    /// </summary>
    public static void ApplyLowercaseGuidText(this ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(Guid))
                {
                    property.SetValueConverter(Required);
                    property.SetColumnType("TEXT");
                }
                else if (property.ClrType == typeof(Guid?))
                {
                    property.SetValueConverter(Optional);
                    property.SetColumnType("TEXT");
                }
            }
        }
    }
}
