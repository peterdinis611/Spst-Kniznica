namespace SpstKniznica.Common.Seed;

/// <summary>
/// Stable GUIDs shared across Author / Category / Book seed data
/// so relations stay consistent in local development.
/// </summary>
public static class LibrarySeedIds
{
    // Categories
    public static readonly Guid CategoryEkonomika = Guid.Parse("a1111111-1111-4111-8111-111111111001");
    public static readonly Guid CategoryDizajn = Guid.Parse("a1111111-1111-4111-8111-111111111002");
    public static readonly Guid CategoryPodnikanie = Guid.Parse("a1111111-1111-4111-8111-111111111003");
    public static readonly Guid CategorySebarozvoj = Guid.Parse("a1111111-1111-4111-8111-111111111004");
    public static readonly Guid CategoryBeletria = Guid.Parse("a1111111-1111-4111-8111-111111111005");
    public static readonly Guid CategoryTechnologie = Guid.Parse("a1111111-1111-4111-8111-111111111006");

    // Authors
    public static readonly Guid AuthorMason = Guid.Parse("b2222222-2222-4222-8222-222222222001");
    public static readonly Guid AuthorHand = Guid.Parse("b2222222-2222-4222-8222-222222222002");
    public static readonly Guid AuthorFreethy = Guid.Parse("b2222222-2222-4222-8222-222222222003");
    public static readonly Guid AuthorMukerji = Guid.Parse("b2222222-2222-4222-8222-222222222004");
    public static readonly Guid AuthorAllen = Guid.Parse("b2222222-2222-4222-8222-222222222005");
    public static readonly Guid AuthorHousel = Guid.Parse("b2222222-2222-4222-8222-222222222006");
    public static readonly Guid AuthorJarvis = Guid.Parse("b2222222-2222-4222-8222-222222222007");
    public static readonly Guid AuthorRidley = Guid.Parse("b2222222-2222-4222-8222-222222222008");
    public static readonly Guid AuthorWilde = Guid.Parse("b2222222-2222-4222-8222-222222222009");
    public static readonly Guid AuthorClear = Guid.Parse("b2222222-2222-4222-8222-222222222010");
    public static readonly Guid AuthorKrug = Guid.Parse("b2222222-2222-4222-8222-222222222011");
    public static readonly Guid AuthorRies = Guid.Parse("b2222222-2222-4222-8222-222222222012");

    // Books
    public static readonly Guid BookPsychMoney = Guid.Parse("c3333333-3333-4333-8333-333333333001");
    public static readonly Guid BookCompanyOne = Guid.Parse("c3333333-3333-4333-8333-333333333002");
    public static readonly Guid BookInnovation = Guid.Parse("c3333333-3333-4333-8333-333333333003");
    public static readonly Guid BookDorian = Guid.Parse("c3333333-3333-4333-8333-333333333004");
    public static readonly Guid BookSorrowBliss = Guid.Parse("c3333333-3333-4333-8333-333333333005");
    public static readonly Guid BookAvailableDark = Guid.Parse("c3333333-3333-4333-8333-333333333006");
    public static readonly Guid BookPrettyPeople = Guid.Parse("c3333333-3333-4333-8333-333333333007");
    public static readonly Guid BookDegrees = Guid.Parse("c3333333-3333-4333-8333-333333333008");
    public static readonly Guid BookFostersOddities = Guid.Parse("c3333333-3333-4333-8333-333333333009");
    public static readonly Guid BookAtomicHabits = Guid.Parse("c3333333-3333-4333-8333-333333333010");
    public static readonly Guid BookDontMakeMeThink = Guid.Parse("c3333333-3333-4333-8333-333333333011");
    public static readonly Guid BookLeanStartup = Guid.Parse("c3333333-3333-4333-8333-333333333012");
}
