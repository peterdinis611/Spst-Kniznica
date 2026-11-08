namespace SpstKniznica.Caching;

public static class CacheKeys
{
    public static string Category(Guid id) => $"category:{id:D}";
    public static string Book(Guid id) => $"book:{id:D}";
    public static string RelationBook(Guid id) => $"relation:book:{id:D}";
    public static string RelationCategory(Guid id) => $"relation:category:{id:D}";
    public static string RelationCategoryBooks(Guid id) => $"relation:category:{id:D}:books";
    public static string RelationSummary() => "relation:summary";

    public const string CategoryPrefix = "category:";
    public const string BookPrefix = "book:";
    public const string RelationPrefix = "relation:";
}
