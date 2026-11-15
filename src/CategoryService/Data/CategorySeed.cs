using CategoryService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Seed;

namespace CategoryService.Data;

public static class CategorySeed
{
    public static async Task EnsureSeededAsync(
        CategoryDbContext db,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var catalog = BuildCatalog(now);
        var existingIds = await db.Categories
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);
        var existing = existingIds.ToHashSet();
        var missing = catalog.Where(c => !existing.Contains(c.Id)).ToList();

        if (missing.Count == 0)
        {
            return;
        }

        Console.WriteLine("[CategorySeed] Seeding {0} categories…", missing.Count);
        db.Categories.AddRange(missing);
        await db.SaveChangesAsync(cancellationToken);
        Console.WriteLine(
            "[CategorySeed] Total categories: {0}.",
            await db.Categories.CountAsync(cancellationToken));
    }

    private static List<Category> BuildCatalog(DateTimeOffset now) =>
    [
        Cat(LibrarySeedIds.CategoryEkonomika, "Ekonomika", "Peniaze, investície a finančná gramotnosť", "#1F4E8C", now),
        Cat(LibrarySeedIds.CategoryDizajn, "Dizajn", "Typografia, UX a vizuálna kultúra", "#7BA08A", now),
        Cat(LibrarySeedIds.CategoryPodnikanie, "Podnikanie", "Inovácie, stratégie a riadenie", "#1C6B7A", now),
        Cat(LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", "Zvyky, produktivita a myslenie", "#3A1D22", now),
        Cat(LibrarySeedIds.CategoryBeletria, "Beletria", "Romány a poviedky pre voľný čas", "#0E1A24", now),
        Cat(LibrarySeedIds.CategoryTechnologie, "Technológie", "Softvér, siete a priemysel 4.0", "#7A4E2D", now),
        Cat(LibrarySeedIds.CategoryHistoria, "História", "Dejiny, spoločnosť a civilizácie", "#5C3A21", now),
        Cat(LibrarySeedIds.CategoryMatematika, "Matematika", "Algebra, geometria a problémové myslenie", "#2F4B7C", now),
        Cat(LibrarySeedIds.CategoryPrirodneVedy, "Prírodné vedy", "Fyzika, kozmológia a prírodné zákony", "#1F5C4A", now),
        Cat(LibrarySeedIds.CategoryProgramovanie, "Programovanie", "Kód, architektúra a softvérové remeslo", "#4A2C6A", now),
        Cat(LibrarySeedIds.CategoryPedagogika, "Pedagogika", "Vzdelávanie, didaktika a učenie", "#8B4513", now),
        Cat(LibrarySeedIds.CategoryFilozofia, "Filozofia", "Etika, poznanie a klasické texty", "#2C2C54", now),
    ];

    private static Category Cat(
        Guid id,
        string name,
        string description,
        string color,
        DateTimeOffset now) =>
        new()
        {
            Id = id,
            Name = name,
            Description = description,
            Color = color,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
}
