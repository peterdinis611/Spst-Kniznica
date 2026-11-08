using AuthorService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Seed;

namespace AuthorService.Data;

public static class AuthorSeed
{
    public static async Task EnsureSeededAsync(
        AuthorDbContext db,
        CancellationToken cancellationToken = default)
    {
        if (await db.Authors.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;

        db.Authors.AddRange(
            new Author
            {
                Id = LibrarySeedIds.AuthorMason,
                Name = "Meg Mason",
                Biography = "Autorka súčasnej prózy s dôrazom na psychológiu postáv.",
                Nationality = "NZ",
                BirthYear = 1979,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorHand,
                Name = "Elizabeth Hand",
                Biography = "Spisovateľka temnej fikcie a napätých príbehov.",
                Nationality = "US",
                BirthYear = 1957,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorFreethy,
                Name = "Barbara Freethy",
                Biography = "Populárna autorka romantických a rodinných ság.",
                Nationality = "US",
                BirthYear = 1960,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorMukerji,
                Name = "Mukerji",
                Biography = "Autorka literárnych príbehov o identite a meste.",
                Nationality = "IN",
                BirthYear = 1985,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorAllen,
                Name = "Allen P.",
                Biography = "Kurátor zvláštnych zbierok a krátkych próz.",
                Nationality = "UK",
                BirthYear = 1982,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorHousel,
                Name = "Morgan Housel",
                Biography = "Esejista o správaní, bohatstve a dlhodobom myslení.",
                Nationality = "US",
                BirthYear = 1984,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorJarvis,
                Name = "Paul Jarvis",
                Biography = "Autor o malých firmách, produktivite a nezávislosti.",
                Nationality = "CA",
                BirthYear = 1978,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorRidley,
                Name = "Matt Ridley",
                Biography = "Vedecký popularizátor a autor kníh o inováciách.",
                Nationality = "UK",
                BirthYear = 1958,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorWilde,
                Name = "Oscar Wilde",
                Biography = "Írsky dramaturg a romanopisec, autor Dorian Gray.",
                Nationality = "IE",
                BirthYear = 1854,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorClear,
                Name = "James Clear",
                Biography = "Autor o zvykoch, produktivite a kontinuálnom zlepšovaní.",
                Nationality = "US",
                BirthYear = 1986,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorKrug,
                Name = "Steve Krug",
                Biography = "UX konzultant a autor kníh o použiteľnosti webu.",
                Nationality = "US",
                BirthYear = 1950,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Author
            {
                Id = LibrarySeedIds.AuthorRies,
                Name = "Eric Ries",
                Biography = "Podnikateľ a autor metodiky Lean Startup.",
                Nationality = "US",
                BirthYear = 1978,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            });

        await db.SaveChangesAsync(cancellationToken);
    }
}
