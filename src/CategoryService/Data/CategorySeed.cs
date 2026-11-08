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
        if (await db.Categories.AnyAsync(cancellationToken))
        {
            return;
        }

        Console.WriteLine("[CategorySeed] Seeding mock categories…");
        var now = DateTimeOffset.UtcNow;

        db.Categories.AddRange(
            new Category
            {
                Id = LibrarySeedIds.CategoryEkonomika,
                Name = "Ekonomika",
                Description = "Peniaze, investície a finančná gramotnosť",
                Color = "#1F4E8C",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Category
            {
                Id = LibrarySeedIds.CategoryDizajn,
                Name = "Dizajn",
                Description = "Typografia, UX a vizuálna kultúra",
                Color = "#7BA08A",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Category
            {
                Id = LibrarySeedIds.CategoryPodnikanie,
                Name = "Podnikanie",
                Description = "Inovácie, stratégie a riadenie",
                Color = "#1C6B7A",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Category
            {
                Id = LibrarySeedIds.CategorySebarozvoj,
                Name = "Sebarozvoj",
                Description = "Zvyky, produktivita a myslenie",
                Color = "#3A1D22",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Category
            {
                Id = LibrarySeedIds.CategoryBeletria,
                Name = "Beletria",
                Description = "Romány a poviedky pre voľný čas",
                Color = "#0E1A24",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Category
            {
                Id = LibrarySeedIds.CategoryTechnologie,
                Name = "Technológie",
                Description = "Softvér, siete a priemysel 4.0",
                Color = "#7A4E2D",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            });

        await db.SaveChangesAsync(cancellationToken);
        Console.WriteLine("[CategorySeed] Seeded {0} categories.", await db.Categories.CountAsync(cancellationToken));
    }
}
