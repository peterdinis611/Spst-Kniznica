using BookService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Seed;

namespace BookService.Data;

public static class BookSeed
{
    public static async Task EnsureSeededAsync(
        BookDbContext db,
        CancellationToken cancellationToken = default)
    {
        if (await db.Books.AnyAsync(cancellationToken))
        {
            return;
        }

        Console.WriteLine("[BookSeed] Seeding mock books…");
        var now = DateTimeOffset.UtcNow;

        var books = new List<Book>
        {
            CreateBook(
                id: LibrarySeedIds.BookPsychMoney,
                title: "The Psychology of Money",
                authorId: LibrarySeedIds.AuthorHousel,
                author: "Morgan Housel",
                categoryId: LibrarySeedIds.CategoryEkonomika,
                categoryName: "Ekonomika",
                year: 2020,
                isbn: "978-0-85719-768-9",
                language: "en",
                publisher: "Harriman House",
                description: "Timeless lessons on wealth, greed, and happiness.",
                pageCount: 256,
                shelf: "E-12",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2), (BookCopyStatus.Borrowed, 3), (BookCopyStatus.Borrowed, 4)]),
            CreateBook(
                id: LibrarySeedIds.BookCompanyOne,
                title: "Company of One",
                authorId: LibrarySeedIds.AuthorJarvis,
                author: "Paul Jarvis",
                categoryId: LibrarySeedIds.CategoryPodnikanie,
                categoryName: "Podnikanie",
                year: 2019,
                isbn: "978-1-328-97335-2",
                language: "en",
                publisher: "Houghton Mifflin Harcourt",
                description: "Why staying small is the next big thing for business.",
                pageCount: 272,
                shelf: "P-04",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2)]),
            CreateBook(
                id: LibrarySeedIds.BookInnovation,
                title: "How Innovation Works",
                authorId: LibrarySeedIds.AuthorRidley,
                author: "Matt Ridley",
                categoryId: LibrarySeedIds.CategoryTechnologie,
                categoryName: "Technológie",
                year: 2020,
                isbn: "978-0-06-291660-0",
                language: "en",
                publisher: "Harper",
                description: "And why it flourishes in freedom.",
                pageCount: 320,
                shelf: "T-08",
                format: BookFormat.Hardcover,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2), (BookCopyStatus.Available, 3)]),
            CreateBook(
                id: LibrarySeedIds.BookDorian,
                title: "The Picture of Dorian Gray",
                authorId: LibrarySeedIds.AuthorWilde,
                author: "Oscar Wilde",
                categoryId: LibrarySeedIds.CategoryBeletria,
                categoryName: "Beletria",
                year: 1890,
                isbn: "978-0-14-143957-0",
                language: "en",
                publisher: "Penguin Classics",
                description: "Klasický román o kráse, morálke a skaze.",
                pageCount: 304,
                shelf: "B-01",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Borrowed, 1), (BookCopyStatus.Borrowed, 2)]),
            CreateBook(
                id: LibrarySeedIds.BookSorrowBliss,
                title: "Sorrow and Bliss",
                authorId: LibrarySeedIds.AuthorMason,
                author: "Meg Mason",
                categoryId: LibrarySeedIds.CategoryBeletria,
                categoryName: "Beletria",
                year: 2020,
                isbn: "978-1-47-215465-1",
                language: "en",
                publisher: "Weidenfeld & Nicolson",
                description: "Súčasná próza o rodine, láske a duševnom zdraví.",
                pageCount: 352,
                shelf: "B-14",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2)]),
            CreateBook(
                id: LibrarySeedIds.BookAvailableDark,
                title: "Available Dark",
                authorId: LibrarySeedIds.AuthorHand,
                author: "Elizabeth Hand",
                categoryId: LibrarySeedIds.CategoryBeletria,
                categoryName: "Beletria",
                year: 2012,
                isbn: "978-0-31-619217-0",
                language: "en",
                publisher: "Minotaur Books",
                description: "Temný thriller s fotografkou Cass Neary.",
                pageCount: 256,
                shelf: "B-22",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2)]),
            CreateBook(
                id: LibrarySeedIds.BookPrettyPeople,
                title: "All the Pretty People",
                authorId: LibrarySeedIds.AuthorFreethy,
                author: "Barbara Freethy",
                categoryId: LibrarySeedIds.CategoryBeletria,
                categoryName: "Beletria",
                year: 2018,
                isbn: "978-0-99-000000-1",
                language: "en",
                publisher: "Fog City Publishing",
                description: "Rodinná sága s tajomstvami a romantickými väzbami.",
                pageCount: 340,
                shelf: "B-31",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2), (BookCopyStatus.Reserved, 3)]),
            CreateBook(
                id: LibrarySeedIds.BookDegrees,
                title: "Degrees",
                authorId: LibrarySeedIds.AuthorMukerji,
                author: "Mukerji",
                categoryId: LibrarySeedIds.CategorySebarozvoj,
                categoryName: "Sebarozvoj",
                year: 2021,
                isbn: "978-1-11-000000-2",
                language: "en",
                publisher: "Indie Press",
                description: "Príbeh o identite, meste a osobnom raste.",
                pageCount: 210,
                shelf: "S-03",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2)]),
            CreateBook(
                id: LibrarySeedIds.BookFostersOddities,
                title: "Foster's Oddities",
                authorId: LibrarySeedIds.AuthorAllen,
                author: "Allen P.",
                categoryId: LibrarySeedIds.CategoryBeletria,
                categoryName: "Beletria",
                year: 2017,
                isbn: "978-1-11-000000-3",
                language: "en",
                publisher: "Cabinet Books",
                description: "Zbierka zvláštnych príbehov a kuriozít.",
                pageCount: 188,
                shelf: "B-07",
                format: BookFormat.Hardcover,
                now: now,
                copies: [(BookCopyStatus.Available, 1)]),
            CreateBook(
                id: LibrarySeedIds.BookAtomicHabits,
                title: "Atomic Habits",
                authorId: LibrarySeedIds.AuthorClear,
                author: "James Clear",
                categoryId: LibrarySeedIds.CategorySebarozvoj,
                categoryName: "Sebarozvoj",
                year: 2018,
                isbn: "978-0-73-521129-2",
                language: "en",
                publisher: "Avery",
                description: "Drobné zvyky, veľké zmeny — praktický sprievodca produktivity.",
                pageCount: 320,
                shelf: "S-11",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2), (BookCopyStatus.Borrowed, 3)]),
            CreateBook(
                id: LibrarySeedIds.BookDontMakeMeThink,
                title: "Don't Make Me Think",
                authorId: LibrarySeedIds.AuthorKrug,
                author: "Steve Krug",
                categoryId: LibrarySeedIds.CategoryDizajn,
                categoryName: "Dizajn",
                year: 2014,
                isbn: "978-0-32-196551-6",
                language: "en",
                publisher: "New Riders",
                description: "Základy použiteľnosti webu pre dizajnérov a vývojárov.",
                pageCount: 216,
                shelf: "D-02",
                format: BookFormat.Paperback,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2)]),
            CreateBook(
                id: LibrarySeedIds.BookLeanStartup,
                title: "The Lean Startup",
                authorId: LibrarySeedIds.AuthorRies,
                author: "Eric Ries",
                categoryId: LibrarySeedIds.CategoryPodnikanie,
                categoryName: "Podnikanie",
                year: 2011,
                isbn: "978-0-30-788789-4",
                language: "en",
                publisher: "Crown Business",
                description: "Budovanie startupov cez experimenty a validated learning.",
                pageCount: 336,
                shelf: "P-19",
                format: BookFormat.Hardcover,
                now: now,
                copies: [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2), (BookCopyStatus.Maintenance, 3)]),
        };

        db.Books.AddRange(books);
        await db.SaveChangesAsync(cancellationToken);
        Console.WriteLine("[BookSeed] Seeded {0} books.", await db.Books.CountAsync(cancellationToken));
    }

    private static Book CreateBook(
        Guid id,
        string title,
        Guid authorId,
        string author,
        Guid categoryId,
        string categoryName,
        int year,
        string isbn,
        string language,
        string publisher,
        string description,
        int pageCount,
        string shelf,
        BookFormat format,
        DateTimeOffset now,
        (BookCopyStatus Status, int Index)[] copies)
    {
        var book = new Book
        {
            Id = id,
            Title = title,
            AuthorId = authorId,
            Author = author,
            CategoryId = categoryId,
            CategoryName = categoryName,
            PublishedYear = year,
            Isbn = isbn,
            Language = language,
            Publisher = publisher,
            Description = description,
            PageCount = pageCount,
            ShelfLocation = shelf,
            Format = format,
            CreatedAt = now,
            UpdatedAt = now,
        };

        var shortId = id.ToString("N")[..8].ToUpperInvariant();
        foreach (var (status, index) in copies)
        {
            book.Copies.Add(new BookCopy
            {
                Id = CreateCopyId(id, index),
                BookId = id,
                InventoryNumber = $"INV-{shortId}-{index:D2}",
                Barcode = $"BC{shortId}{index:D2}",
                Status = status,
                ShelfLocation = shelf,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }

        book.RecalculateCopyCounts();
        return book;
    }

    private static Guid CreateCopyId(Guid bookId, int index)
    {
        var bytes = bookId.ToByteArray();
        bytes[15] = (byte)index;
        bytes[14] = (byte)(bytes[14] ^ 0xA5);
        return new Guid(bytes);
    }
}
