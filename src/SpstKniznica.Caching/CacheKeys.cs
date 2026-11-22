namespace SpstKniznica.Caching;

public static class CacheKeys
{
    public static string Category(Guid id) => $"category:{id:D}";
    public static string Author(Guid id) => $"author:{id:D}";
    public static string Book(Guid id) => $"book:{id:D}";
    public static string Booking(Guid id) => $"booking:{id:D}";
    public static string RelationBook(Guid id) => $"relation:book:{id:D}";
    public static string RelationCategory(Guid id) => $"relation:category:{id:D}";
    public static string RelationCategoryBooks(Guid id) => $"relation:category:{id:D}:books";
    public static string RelationAuthor(Guid id) => $"relation:author:{id:D}";
    public static string RelationAuthorBooks(Guid id) => $"relation:author:{id:D}:books";
    public static string RelationSummary() => "relation:summary";

    public const string CategoryPrefix = "category:";
    /// <summary>Category page/cursor lists — dropped on every category mutate.</summary>
    public const string CategoryListPrefix = "categories:list:";
    public const string AuthorPrefix = "author:";
    /// <summary>Author page/cursor lists — dropped on every author mutate.</summary>
    public const string AuthorListPrefix = "authors:list:";
    public const string BookPrefix = "book:";
    /// <summary>Page, cursor, and per-book summary keys. Dropped on every book or copy change.</summary>
    public const string BookListPrefix = "books:list:";
    public const string BookingPrefix = "booking:";
    public const string RelationPrefix = "relation:";
}
