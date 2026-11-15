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
        var now = DateTimeOffset.UtcNow;
        var catalog = BuildCatalog(now);
        var existingIds = await db.Books
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);
        var existing = existingIds.ToHashSet();
        var missing = catalog.Where(b => !existing.Contains(b.Id)).ToList();

        if (missing.Count == 0)
        {
            return;
        }

        Console.WriteLine("[BookSeed] Seeding {0} books…", missing.Count);
        db.Books.AddRange(missing);
        await db.SaveChangesAsync(cancellationToken);
        Console.WriteLine(
            "[BookSeed] Total books: {0}.",
            await db.Books.CountAsync(cancellationToken));
    }

    private static List<Book> BuildCatalog(DateTimeOffset now) =>
    [
        B(LibrarySeedIds.BookPsychMoney, "The Psychology of Money", LibrarySeedIds.AuthorHousel, "Morgan Housel", LibrarySeedIds.CategoryEkonomika, "Ekonomika", 2020, "978-0-85719-768-9", "en", "Harriman House", "Timeless lessons on wealth, greed, and happiness.", 256, "E-12", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2), (BookCopyStatus.Borrowed, 3), (BookCopyStatus.Borrowed, 4)]),
        B(LibrarySeedIds.BookCompanyOne, "Company of One", LibrarySeedIds.AuthorJarvis, "Paul Jarvis", LibrarySeedIds.CategoryPodnikanie, "Podnikanie", 2019, "978-1-328-97335-2", "en", "Houghton Mifflin Harcourt", "Why staying small is the next big thing for business.", 272, "P-04", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2)]),
        B(LibrarySeedIds.BookInnovation, "How Innovation Works", LibrarySeedIds.AuthorRidley, "Matt Ridley", LibrarySeedIds.CategoryTechnologie, "Technológie", 2020, "978-0-06-291660-0", "en", "Harper", "And why it flourishes in freedom.", 320, "T-08", BookFormat.Hardcover, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2), (BookCopyStatus.Available, 3)]),
        B(LibrarySeedIds.BookDorian, "The Picture of Dorian Gray", LibrarySeedIds.AuthorWilde, "Oscar Wilde", LibrarySeedIds.CategoryBeletria, "Beletria", 1890, "978-0-14-143957-0", "en", "Penguin Classics", "Klasický román o kráse, morálke a skaze.", 304, "B-01", BookFormat.Paperback, now, [(BookCopyStatus.Borrowed, 1), (BookCopyStatus.Borrowed, 2)]),
        B(LibrarySeedIds.BookSorrowBliss, "Sorrow and Bliss", LibrarySeedIds.AuthorMason, "Meg Mason", LibrarySeedIds.CategoryBeletria, "Beletria", 2020, "978-1-47-215465-1", "en", "Weidenfeld & Nicolson", "Súčasná próza o rodine, láske a duševnom zdraví.", 352, "B-14", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2)]),
        B(LibrarySeedIds.BookAvailableDark, "Available Dark", LibrarySeedIds.AuthorHand, "Elizabeth Hand", LibrarySeedIds.CategoryBeletria, "Beletria", 2012, "978-0-31-619217-0", "en", "Minotaur Books", "Temný thriller s fotografkou Cass Neary.", 256, "B-22", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2)]),
        B(LibrarySeedIds.BookPrettyPeople, "All the Pretty People", LibrarySeedIds.AuthorFreethy, "Barbara Freethy", LibrarySeedIds.CategoryBeletria, "Beletria", 2018, "978-0-99-000000-1", "en", "Fog City Publishing", "Rodinná sága s tajomstvami a romantickými väzbami.", 340, "B-31", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2), (BookCopyStatus.Reserved, 3)]),
        B(LibrarySeedIds.BookDegrees, "Degrees", LibrarySeedIds.AuthorMukerji, "Mukerji", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2021, "978-1-11-000000-2", "en", "Indie Press", "Príbeh o identite, meste a osobnom raste.", 210, "S-03", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2)]),
        B(LibrarySeedIds.BookFostersOddities, "Foster's Oddities", LibrarySeedIds.AuthorAllen, "Allen P.", LibrarySeedIds.CategoryBeletria, "Beletria", 2017, "978-1-11-000000-3", "en", "Cabinet Books", "Zbierka zvláštnych príbehov a kuriozít.", 188, "B-07", BookFormat.Hardcover, now, [(BookCopyStatus.Available, 1)]),
        B(LibrarySeedIds.BookAtomicHabits, "Atomic Habits", LibrarySeedIds.AuthorClear, "James Clear", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2018, "978-0-73-521129-2", "en", "Avery", "Drobné zvyky, veľké zmeny — praktický sprievodca produktivity.", 320, "S-11", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2), (BookCopyStatus.Borrowed, 3)]),
        B(LibrarySeedIds.BookDontMakeMeThink, "Don't Make Me Think", LibrarySeedIds.AuthorKrug, "Steve Krug", LibrarySeedIds.CategoryDizajn, "Dizajn", 2014, "978-0-32-196551-6", "en", "New Riders", "Základy použiteľnosti webu pre dizajnérov a vývojárov.", 216, "D-02", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2)]),
        B(LibrarySeedIds.BookLeanStartup, "The Lean Startup", LibrarySeedIds.AuthorRies, "Eric Ries", LibrarySeedIds.CategoryPodnikanie, "Podnikanie", 2011, "978-0-30-788789-4", "en", "Crown Business", "Budovanie startupov cez experimenty a validated learning.", 336, "P-19", BookFormat.Hardcover, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2), (BookCopyStatus.Maintenance, 3)]),
        B(LibrarySeedIds.BookSapiens, "Sapiens", LibrarySeedIds.AuthorHarari, "Yuval Noah Harari", LibrarySeedIds.CategoryHistoria, "História", 2011, "978-0-06-231609-7", "en", "Harper", "Stručné dejiny ľudstva od lovcov po súčasnosť.", 443, "H-01", BookFormat.Paperback, now, Avail(3)),
        B(LibrarySeedIds.BookHomoDeus, "Homo Deus", LibrarySeedIds.AuthorHarari, "Yuval Noah Harari", LibrarySeedIds.CategoryHistoria, "História", 2015, "978-0-06-246431-6", "en", "Harper", "Stručné dejiny zajtrajška.", 449, "H-02", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookThinkingFastSlow, "Thinking, Fast and Slow", LibrarySeedIds.AuthorKahneman, "Daniel Kahneman", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2011, "978-0-37-453355-7", "en", "Farrar, Straus and Giroux", "Dva systémy myslenia a rozhodovania.", 499, "S-21", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2)]),
        B(LibrarySeedIds.BookDeepWork, "Deep Work", LibrarySeedIds.AuthorNewport, "Cal Newport", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2016, "978-1-45-558669-1", "en", "Grand Central", "Pravidlá sústredenej práce v rozptýlenom svete.", 296, "S-22", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.BookDigitalMinimalism, "Digital Minimalism", LibrarySeedIds.AuthorNewport, "Cal Newport", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2019, "978-0-52-553651-2", "en", "Portfolio", "Život s menej technológiami a viac zmyslu.", 304, "S-23", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookDesignOfEveryday, "The Design of Everyday Things", LibrarySeedIds.AuthorNorman, "Don Norman", LibrarySeedIds.CategoryDizajn, "Dizajn", 2013, "978-0-46-505065-9", "en", "Basic Books", "Psychológia a dizajn každodenných predmetov.", 368, "D-11", BookFormat.Paperback, now, Avail(3)),
        B(LibrarySeedIds.BookStartWithWhy, "Start with Why", LibrarySeedIds.AuthorSinek, "Simon Sinek", LibrarySeedIds.CategoryPodnikanie, "Podnikanie", 2009, "978-1-59-184644-4", "en", "Portfolio", "Ako veľkí lídri inšpirujú k akcii.", 256, "P-21", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookAlchemist, "The Alchemist", LibrarySeedIds.AuthorCoelho, "Paulo Coelho", LibrarySeedIds.CategoryBeletria, "Beletria", 1988, "978-0-06-231500-7", "en", "HarperOne", "Allegorický román o hľadaní osobnej legendy.", 208, "B-40", BookFormat.Paperback, now, Avail(3)),
        B(LibrarySeedIds.Book1984, "1984", LibrarySeedIds.AuthorOrwell, "George Orwell", LibrarySeedIds.CategoryBeletria, "Beletria", 1949, "978-0-45-152493-5", "en", "Signet Classics", "Dystópia o kontrole, jazyku a slobode.", 328, "B-41", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Borrowed, 2), (BookCopyStatus.Available, 3)]),
        B(LibrarySeedIds.BookAnimalFarm, "Animal Farm", LibrarySeedIds.AuthorOrwell, "George Orwell", LibrarySeedIds.CategoryBeletria, "Beletria", 1945, "978-0-45-152634-2", "en", "Signet Classics", "Satira moci a revolúcie.", 140, "B-42", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookPridePrejudice, "Pride and Prejudice", LibrarySeedIds.AuthorAusten, "Jane Austen", LibrarySeedIds.CategoryBeletria, "Beletria", 1813, "978-0-14-143951-8", "en", "Penguin Classics", "Klasický román o triedach, predsudkoch a láske.", 432, "B-43", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookFoundation, "Foundation", LibrarySeedIds.AuthorAsimov, "Isaac Asimov", LibrarySeedIds.CategoryTechnologie, "Technológie", 1951, "978-0-55-329335-7", "en", "Bantam", "Sci-fi sága o páde galaktického impéria.", 244, "T-21", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookIRobot, "I, Robot", LibrarySeedIds.AuthorAsimov, "Isaac Asimov", LibrarySeedIds.CategoryTechnologie, "Technológie", 1950, "978-0-55-329438-5", "en", "Bantam", "Poviedky o robotoch a troch zákonoch robotiky.", 224, "T-22", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookSparkJoy, "Spark Joy", LibrarySeedIds.AuthorKondo, "Marie Kondo", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2016, "978-1-60-774972-1", "en", "Ten Speed Press", "Ilustrovaný sprievodca umením upratovania.", 304, "S-30", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.Book4HourWorkweek, "The 4-Hour Workweek", LibrarySeedIds.AuthorFerriss, "Tim Ferriss", LibrarySeedIds.CategoryPodnikanie, "Podnikanie", 2007, "978-0-30-746535-1", "en", "Crown", "Útek z 9–5 a život podľa vlastných pravidiel.", 396, "P-30", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookGiveAndTake, "Give and Take", LibrarySeedIds.AuthorGrant, "Adam Grant", LibrarySeedIds.CategoryPodnikanie, "Podnikanie", 2013, "978-0-14-312498-6", "en", "Penguin", "Prečo pomáhanie druhým prináša úspech.", 320, "P-31", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookMadeToStick, "Made to Stick", LibrarySeedIds.AuthorHeath, "Chip Heath", LibrarySeedIds.CategoryPedagogika, "Pedagogika", 2007, "978-1-40-006428-1", "en", "Random House", "Prečo niektoré myšlienky prežijú a iné nie.", 336, "G-01", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.BookBlackSwan, "The Black Swan", LibrarySeedIds.AuthorTaleb, "Nassim Nicholas Taleb", LibrarySeedIds.CategoryEkonomika, "Ekonomika", 2007, "978-0-81-297381-5", "en", "Random House", "Vplyv vysoko nepravdepodobných udalostí.", 444, "E-20", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookCleanCode, "Clean Code", LibrarySeedIds.AuthorMartin, "Robert C. Martin", LibrarySeedIds.CategoryProgramovanie, "Programovanie", 2008, "978-0-13-235088-4", "en", "Prentice Hall", "Príručka remeselného softvérového kódu.", 464, "C-01", BookFormat.Paperback, now, [(BookCopyStatus.Available, 1), (BookCopyStatus.Available, 2), (BookCopyStatus.Borrowed, 3)]),
        B(LibrarySeedIds.BookCleanArchitecture, "Clean Architecture", LibrarySeedIds.AuthorMartin, "Robert C. Martin", LibrarySeedIds.CategoryProgramovanie, "Programovanie", 2017, "978-0-13-449416-6", "en", "Prentice Hall", "Štruktúra a návrh softvérových systémov.", 432, "C-02", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookRefactoring, "Refactoring", LibrarySeedIds.AuthorFowler, "Martin Fowler", LibrarySeedIds.CategoryProgramovanie, "Programovanie", 2018, "978-0-13-475759-9", "en", "Addison-Wesley", "Zlepšovanie návrhu existujúceho kódu.", 448, "C-03", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.BookCProgramming, "The C Programming Language", LibrarySeedIds.AuthorKernighan, "Brian W. Kernighan", LibrarySeedIds.CategoryProgramovanie, "Programovanie", 1988, "978-0-13-110362-7", "en", "Prentice Hall", "Klasická učebnica jazyka C.", 272, "C-04", BookFormat.Paperback, now, Avail(3)),
        B(LibrarySeedIds.BookBriefHistoryTime, "A Brief History of Time", LibrarySeedIds.AuthorHawking, "Stephen Hawking", LibrarySeedIds.CategoryPrirodneVedy, "Prírodné vedy", 1988, "978-0-55-338016-3", "en", "Bantam", "Od veľkého tresku k čiernym dieram.", 212, "N-01", BookFormat.Paperback, now, Avail(3)),
        B(LibrarySeedIds.BookOutliers, "Outliers", LibrarySeedIds.AuthorGladwell, "Malcolm Gladwell", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2008, "978-0-31-601793-0", "en", "Little, Brown", "Príbeh úspechu mimo priemeru.", 336, "S-40", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookBlink, "Blink", LibrarySeedIds.AuthorGladwell, "Malcolm Gladwell", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2005, "978-0-31-601066-5", "en", "Little, Brown", "Sila myslenia bez myslenia.", 320, "S-41", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookResonate, "Resonate", LibrarySeedIds.AuthorDuarte, "Nancy Duarte", LibrarySeedIds.CategoryDizajn, "Dizajn", 2010, "978-0-47-063201-7", "en", "Wiley", "Prezentácie, ktoré menia publikum.", 272, "D-20", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookFlow, "Flow", LibrarySeedIds.AuthorCsikszentmihalyi, "Mihaly Csikszentmihalyi", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 1990, "978-0-06-133920-2", "en", "Harper Perennial", "Psychológia optimálneho prežívania.", 336, "S-50", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookRepublic, "Ústava", LibrarySeedIds.AuthorPlato, "Platón", LibrarySeedIds.CategoryFilozofia, "Filozofia", null, "978-0-14-044914-3", "sk", "Kalligram", "Dialóg o spravodlivosti a ideálnom štáte.", 416, "F-01", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookMeditations, "Meditácie o prvej filozofii", LibrarySeedIds.AuthorDescartes, "René Descartes", LibrarySeedIds.CategoryFilozofia, "Filozofia", 1641, "978-80-7141-123-4", "sk", "Oikoymenh", "Základy modernej filozofie a pochybnosti.", 192, "F-02", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookElements, "Základy", LibrarySeedIds.AuthorEuclid, "Euklides", LibrarySeedIds.CategoryMatematika, "Matematika", null, "978-0-48-660088-8", "sk", "Dover", "Klasické základy euklidovskej geometrie.", 464, "M-01", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookSoGoodTheyCant, "So Good They Can't Ignore You", LibrarySeedIds.AuthorNewport, "Cal Newport", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2012, "978-1-45-550912-6", "en", "Business Plus", "Prečo zručnosti bijú vášeň v kariére.", 304, "S-24", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.BookHooked, "Hooked", LibrarySeedIds.AuthorEyal, "Nir Eyal", LibrarySeedIds.CategoryTechnologie, "Technológie", 2014, "978-1-59-184778-6", "en", "Portfolio", "Ako budovať návykové produkty.", 256, "T-30", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookEmotionalDesign, "Emotional Design", LibrarySeedIds.AuthorNorman, "Don Norman", LibrarySeedIds.CategoryDizajn, "Dizajn", 2004, "978-0-46-505136-6", "en", "Basic Books", "Prečo milujeme (alebo nenávidíme) veci.", 272, "D-12", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookLeadersEatLast, "Leaders Eat Last", LibrarySeedIds.AuthorSinek, "Simon Sinek", LibrarySeedIds.CategoryPodnikanie, "Podnikanie", 2014, "978-1-59-184532-4", "en", "Portfolio", "Prečo niektoré tímy ťahajú spolu a iné nie.", 368, "P-22", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookNexus, "Nexus", LibrarySeedIds.AuthorHarari, "Yuval Noah Harari", LibrarySeedIds.CategoryHistoria, "História", 2024, "978-0-59-373422-5", "en", "Random House", "Stručné dejiny informačných sietí.", 528, "H-03", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.BookAntifragile, "Antifragile", LibrarySeedIds.AuthorTaleb, "Nassim Nicholas Taleb", LibrarySeedIds.CategoryEkonomika, "Ekonomika", 2012, "978-0-81-297968-8", "en", "Random House", "Veci, ktoré získavajú z chaosu.", 544, "E-21", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookOriginals, "Originals", LibrarySeedIds.AuthorGrant, "Adam Grant", LibrarySeedIds.CategoryPodnikanie, "Podnikanie", 2016, "978-0-52-542956-2", "en", "Viking", "Ako nonkonformisti hýbu svetom.", 336, "P-32", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookSwitch, "Switch", LibrarySeedIds.AuthorHeath, "Chip Heath", LibrarySeedIds.CategoryPedagogika, "Pedagogika", 2010, "978-0-38-552875-7", "en", "Broadway Books", "Ako meniť veci, keď je zmena ťažká.", 320, "G-02", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.BookToolsOfTitans, "Tools of Titans", LibrarySeedIds.AuthorFerriss, "Tim Ferriss", LibrarySeedIds.CategorySebarozvoj, "Sebarozvoj", 2016, "978-1-32-868378-6", "en", "Houghton Mifflin Harcourt", "Taktiky, návyky a rutiny svetových performerov.", 704, "S-60", BookFormat.Hardcover, now, Avail(1)),
        B(LibrarySeedIds.BookUniverseInNutshell, "The Universe in a Nutshell", LibrarySeedIds.AuthorHawking, "Stephen Hawking", LibrarySeedIds.CategoryPrirodneVedy, "Prírodné vedy", 2001, "978-0-55-380202-3", "en", "Bantam", "Ilustrovaný sprievodca modernou fyzikou.", 224, "N-02", BookFormat.Hardcover, now, Avail(2)),
        B(LibrarySeedIds.BookPedagogyOppressed, "Pedagogika utláčaných", LibrarySeedIds.AuthorFreire, "Paulo Freire", LibrarySeedIds.CategoryPedagogika, "Pedagogika", 1968, "978-0-82-641276-8", "sk", "Epos", "Kritická pedagogika a oslobodzujúce vzdelávanie.", 192, "G-10", BookFormat.Paperback, now, Avail(2)),
        B(LibrarySeedIds.BookHowToSolveIt, "How to Solve It", LibrarySeedIds.AuthorPolya, "George Pólya", LibrarySeedIds.CategoryMatematika, "Matematika", 1945, "978-0-69-116407-6", "en", "Princeton", "Heuristika riešenia matematických problémov.", 288, "M-02", BookFormat.Paperback, now, Avail(3)),
    ];

    private static (BookCopyStatus Status, int Index)[] Avail(int count) =>
        Enumerable.Range(1, count)
            .Select(i => (BookCopyStatus.Available, i))
            .ToArray();

    private static Book B(
        Guid id,
        string title,
        Guid authorId,
        string author,
        Guid categoryId,
        string categoryName,
        int? year,
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
