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
        var now = DateTimeOffset.UtcNow;
        var catalog = BuildCatalog(now);
        var existingIds = await db.Authors
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);
        var existing = existingIds.ToHashSet();
        var missing = catalog.Where(a => !existing.Contains(a.Id)).ToList();

        if (missing.Count == 0)
        {
            return;
        }

        Console.WriteLine("[AuthorSeed] Seeding {0} authors…", missing.Count);
        db.Authors.AddRange(missing);
        await db.SaveChangesAsync(cancellationToken);
        Console.WriteLine(
            "[AuthorSeed] Total authors: {0}.",
            await db.Authors.CountAsync(cancellationToken));
    }

    private static List<Author> BuildCatalog(DateTimeOffset now) =>
    [
        A(LibrarySeedIds.AuthorMason, "Meg Mason", "Autorka súčasnej prózy s dôrazom na psychológiu postáv.", "NZ", 1979, now),
        A(LibrarySeedIds.AuthorHand, "Elizabeth Hand", "Spisovateľka temnej fikcie a napätých príbehov.", "US", 1957, now),
        A(LibrarySeedIds.AuthorFreethy, "Barbara Freethy", "Populárna autorka romantických a rodinných ság.", "US", 1960, now),
        A(LibrarySeedIds.AuthorMukerji, "Mukerji", "Autorka literárnych príbehov o identite a meste.", "IN", 1985, now),
        A(LibrarySeedIds.AuthorAllen, "Allen P.", "Kurátor zvláštnych zbierok a krátkych próz.", "UK", 1982, now),
        A(LibrarySeedIds.AuthorHousel, "Morgan Housel", "Esejista o správaní, bohatstve a dlhodobom myslení.", "US", 1984, now),
        A(LibrarySeedIds.AuthorJarvis, "Paul Jarvis", "Autor o malých firmách, produktivite a nezávislosti.", "CA", 1978, now),
        A(LibrarySeedIds.AuthorRidley, "Matt Ridley", "Vedecký popularizátor a autor kníh o inováciách.", "UK", 1958, now),
        A(LibrarySeedIds.AuthorWilde, "Oscar Wilde", "Írsky dramaturg a romanopisec, autor Dorian Gray.", "IE", 1854, now),
        A(LibrarySeedIds.AuthorClear, "James Clear", "Autor o zvykoch, produktivite a kontinuálnom zlepšovaní.", "US", 1986, now),
        A(LibrarySeedIds.AuthorKrug, "Steve Krug", "UX konzultant a autor kníh o použiteľnosti webu.", "US", 1950, now),
        A(LibrarySeedIds.AuthorRies, "Eric Ries", "Podnikateľ a autor metodiky Lean Startup.", "US", 1978, now),
        A(LibrarySeedIds.AuthorHarari, "Yuval Noah Harari", "Historik a autor bestsellerov o dejinách ľudstva.", "IL", 1976, now),
        A(LibrarySeedIds.AuthorKahneman, "Daniel Kahneman", "Psychológ a nobelista, výskum rozhodovania.", "IL", 1934, now),
        A(LibrarySeedIds.AuthorNewport, "Cal Newport", "Autor o sústredení, kariére a digitálnom minimalizme.", "US", 1982, now),
        A(LibrarySeedIds.AuthorNorman, "Don Norman", "Pionier UX a kognitívneho dizajnu produktov.", "US", 1935, now),
        A(LibrarySeedIds.AuthorSinek, "Simon Sinek", "Autor o vodcovstve a zmysle práce.", "UK", 1973, now),
        A(LibrarySeedIds.AuthorCoelho, "Paulo Coelho", "Brazílsky romanopisec, autor Alchymistu.", "BR", 1947, now),
        A(LibrarySeedIds.AuthorOrwell, "George Orwell", "Britský spisovateľ a kritik totalitných režimov.", "UK", 1903, now),
        A(LibrarySeedIds.AuthorAusten, "Jane Austen", "Klasická anglická romanopiskyňa.", "UK", 1775, now),
        A(LibrarySeedIds.AuthorAsimov, "Isaac Asimov", "Autor sci-fi a popularizátor vedy.", "US", 1920, now),
        A(LibrarySeedIds.AuthorKondo, "Marie Kondo", "Autorka o upratovaní a životnom štýle.", "JP", 1984, now),
        A(LibrarySeedIds.AuthorFerriss, "Tim Ferriss", "Autor o produktivite, návykoch a experimentovaní.", "US", 1977, now),
        A(LibrarySeedIds.AuthorGrant, "Adam Grant", "Organizačný psychológ o práci a kreativite.", "US", 1981, now),
        A(LibrarySeedIds.AuthorHeath, "Chip Heath", "Autor o komunikácii zmien a sticky ideas.", "US", 1967, now),
        A(LibrarySeedIds.AuthorTaleb, "Nassim Nicholas Taleb", "Esejista o riziku, náhode a antifragilite.", "LB", 1960, now),
        A(LibrarySeedIds.AuthorMartin, "Robert C. Martin", "Softvérový inžinier, autor Clean Code.", "US", 1952, now),
        A(LibrarySeedIds.AuthorFowler, "Martin Fowler", "Autor o refaktoringu a softvérovej architektúre.", "UK", 1963, now),
        A(LibrarySeedIds.AuthorKernighan, "Brian W. Kernighan", "Spoluautor C a Unix kultúry.", "CA", 1942, now),
        A(LibrarySeedIds.AuthorHawking, "Stephen Hawking", "Fyzik a popularizátor kozmológie.", "UK", 1942, now),
        A(LibrarySeedIds.AuthorGladwell, "Malcolm Gladwell", "Novinár a autor kníh o sociálnej psychológii.", "CA", 1963, now),
        A(LibrarySeedIds.AuthorDuarte, "Nancy Duarte", "Autorka o prezentáciách a storytellingu.", "US", 1967, now),
        A(LibrarySeedIds.AuthorCsikszentmihalyi, "Mihaly Csikszentmihalyi", "Psychológ flow a pozitívnej psychológie.", "HU", 1934, now),
        A(LibrarySeedIds.AuthorPlato, "Platón", "Klasický grécky filozof, autor Ústavy.", "GR", null, now),
        A(LibrarySeedIds.AuthorDescartes, "René Descartes", "Filozof a matematik, autor Meditácií.", "FR", 1596, now),
        A(LibrarySeedIds.AuthorEuclid, "Euklides", "Antický matematik, autor Základov.", "GR", null, now),
        A(LibrarySeedIds.AuthorFreire, "Paulo Freire", "Pedagóg a autor Pedagogiky utláčaných.", "BR", 1921, now),
        A(LibrarySeedIds.AuthorPolya, "George Pólya", "Matematik a autor How to Solve It.", "HU", 1887, now),
        A(LibrarySeedIds.AuthorEyal, "Nir Eyal", "Autor o návykových produktoch a pozornosti.", "IL", 1980, now),
    ];

    private static Author A(
        Guid id,
        string name,
        string biography,
        string nationality,
        int? birthYear,
        DateTimeOffset now) =>
        new()
        {
            Id = id,
            Name = name,
            Biography = biography,
            Nationality = nationality,
            BirthYear = birthYear,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
}
