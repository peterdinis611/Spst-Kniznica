namespace SpstKniznica.Common.Seed;

/// <summary>
/// Stable GUIDs shared across Author / Category / Book seed data
/// so relations stay consistent in local development.
/// </summary>
public static class LibrarySeedIds
{
    // Categories (001–012)
    public static readonly Guid CategoryEkonomika = Guid.Parse("a1111111-1111-4111-8111-111111111001");
    public static readonly Guid CategoryDizajn = Guid.Parse("a1111111-1111-4111-8111-111111111002");
    public static readonly Guid CategoryPodnikanie = Guid.Parse("a1111111-1111-4111-8111-111111111003");
    public static readonly Guid CategorySebarozvoj = Guid.Parse("a1111111-1111-4111-8111-111111111004");
    public static readonly Guid CategoryBeletria = Guid.Parse("a1111111-1111-4111-8111-111111111005");
    public static readonly Guid CategoryTechnologie = Guid.Parse("a1111111-1111-4111-8111-111111111006");
    public static readonly Guid CategoryHistoria = Guid.Parse("a1111111-1111-4111-8111-111111111007");
    public static readonly Guid CategoryMatematika = Guid.Parse("a1111111-1111-4111-8111-111111111008");
    public static readonly Guid CategoryPrirodneVedy = Guid.Parse("a1111111-1111-4111-8111-111111111009");
    public static readonly Guid CategoryProgramovanie = Guid.Parse("a1111111-1111-4111-8111-11111111100a");
    public static readonly Guid CategoryPedagogika = Guid.Parse("a1111111-1111-4111-8111-11111111100b");
    public static readonly Guid CategoryFilozofia = Guid.Parse("a1111111-1111-4111-8111-11111111100c");

    // Authors (001–030)
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
    public static readonly Guid AuthorHarari = Guid.Parse("b2222222-2222-4222-8222-222222222013");
    public static readonly Guid AuthorKahneman = Guid.Parse("b2222222-2222-4222-8222-222222222014");
    public static readonly Guid AuthorNewport = Guid.Parse("b2222222-2222-4222-8222-222222222015");
    public static readonly Guid AuthorNorman = Guid.Parse("b2222222-2222-4222-8222-222222222016");
    public static readonly Guid AuthorSinek = Guid.Parse("b2222222-2222-4222-8222-222222222017");
    public static readonly Guid AuthorCoelho = Guid.Parse("b2222222-2222-4222-8222-222222222018");
    public static readonly Guid AuthorOrwell = Guid.Parse("b2222222-2222-4222-8222-222222222019");
    public static readonly Guid AuthorAusten = Guid.Parse("b2222222-2222-4222-8222-22222222201a");
    public static readonly Guid AuthorAsimov = Guid.Parse("b2222222-2222-4222-8222-22222222201b");
    public static readonly Guid AuthorKondo = Guid.Parse("b2222222-2222-4222-8222-22222222201c");
    public static readonly Guid AuthorFerriss = Guid.Parse("b2222222-2222-4222-8222-22222222201d");
    public static readonly Guid AuthorGrant = Guid.Parse("b2222222-2222-4222-8222-22222222201e");
    public static readonly Guid AuthorHeath = Guid.Parse("b2222222-2222-4222-8222-22222222201f");
    public static readonly Guid AuthorTaleb = Guid.Parse("b2222222-2222-4222-8222-222222222020");
    public static readonly Guid AuthorMartin = Guid.Parse("b2222222-2222-4222-8222-222222222021");
    public static readonly Guid AuthorFowler = Guid.Parse("b2222222-2222-4222-8222-222222222022");
    public static readonly Guid AuthorKernighan = Guid.Parse("b2222222-2222-4222-8222-222222222023");
    public static readonly Guid AuthorHawking = Guid.Parse("b2222222-2222-4222-8222-222222222024");
    public static readonly Guid AuthorGladwell = Guid.Parse("b2222222-2222-4222-8222-222222222025");
    public static readonly Guid AuthorDuarte = Guid.Parse("b2222222-2222-4222-8222-222222222026");
    public static readonly Guid AuthorCsikszentmihalyi = Guid.Parse("b2222222-2222-4222-8222-222222222027");
    public static readonly Guid AuthorPlato = Guid.Parse("b2222222-2222-4222-8222-222222222028");
    public static readonly Guid AuthorDescartes = Guid.Parse("b2222222-2222-4222-8222-222222222029");
    public static readonly Guid AuthorEuclid = Guid.Parse("b2222222-2222-4222-8222-22222222202a");
    public static readonly Guid AuthorFreire = Guid.Parse("b2222222-2222-4222-8222-22222222202b");
    public static readonly Guid AuthorPolya = Guid.Parse("b2222222-2222-4222-8222-22222222202c");
    public static readonly Guid AuthorEyal = Guid.Parse("b2222222-2222-4222-8222-22222222202d");

    // Books (001–048)
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
    public static readonly Guid BookSapiens = Guid.Parse("c3333333-3333-4333-8333-333333333013");
    public static readonly Guid BookHomoDeus = Guid.Parse("c3333333-3333-4333-8333-333333333014");
    public static readonly Guid BookThinkingFastSlow = Guid.Parse("c3333333-3333-4333-8333-333333333015");
    public static readonly Guid BookDeepWork = Guid.Parse("c3333333-3333-4333-8333-333333333016");
    public static readonly Guid BookDigitalMinimalism = Guid.Parse("c3333333-3333-4333-8333-333333333017");
    public static readonly Guid BookDesignOfEveryday = Guid.Parse("c3333333-3333-4333-8333-333333333018");
    public static readonly Guid BookStartWithWhy = Guid.Parse("c3333333-3333-4333-8333-333333333019");
    public static readonly Guid BookAlchemist = Guid.Parse("c3333333-3333-4333-8333-33333333301a");
    public static readonly Guid Book1984 = Guid.Parse("c3333333-3333-4333-8333-33333333301b");
    public static readonly Guid BookAnimalFarm = Guid.Parse("c3333333-3333-4333-8333-33333333301c");
    public static readonly Guid BookPridePrejudice = Guid.Parse("c3333333-3333-4333-8333-33333333301d");
    public static readonly Guid BookFoundation = Guid.Parse("c3333333-3333-4333-8333-33333333301e");
    public static readonly Guid BookIRobot = Guid.Parse("c3333333-3333-4333-8333-33333333301f");
    public static readonly Guid BookSparkJoy = Guid.Parse("c3333333-3333-4333-8333-333333333020");
    public static readonly Guid Book4HourWorkweek = Guid.Parse("c3333333-3333-4333-8333-333333333021");
    public static readonly Guid BookGiveAndTake = Guid.Parse("c3333333-3333-4333-8333-333333333022");
    public static readonly Guid BookMadeToStick = Guid.Parse("c3333333-3333-4333-8333-333333333023");
    public static readonly Guid BookBlackSwan = Guid.Parse("c3333333-3333-4333-8333-333333333024");
    public static readonly Guid BookCleanCode = Guid.Parse("c3333333-3333-4333-8333-333333333025");
    public static readonly Guid BookCleanArchitecture = Guid.Parse("c3333333-3333-4333-8333-333333333026");
    public static readonly Guid BookRefactoring = Guid.Parse("c3333333-3333-4333-8333-333333333027");
    public static readonly Guid BookCProgramming = Guid.Parse("c3333333-3333-4333-8333-333333333028");
    public static readonly Guid BookBriefHistoryTime = Guid.Parse("c3333333-3333-4333-8333-333333333029");
    public static readonly Guid BookOutliers = Guid.Parse("c3333333-3333-4333-8333-33333333302a");
    public static readonly Guid BookBlink = Guid.Parse("c3333333-3333-4333-8333-33333333302b");
    public static readonly Guid BookResonate = Guid.Parse("c3333333-3333-4333-8333-33333333302c");
    public static readonly Guid BookFlow = Guid.Parse("c3333333-3333-4333-8333-33333333302d");
    public static readonly Guid BookRepublic = Guid.Parse("c3333333-3333-4333-8333-33333333302e");
    public static readonly Guid BookMeditations = Guid.Parse("c3333333-3333-4333-8333-33333333302f");
    public static readonly Guid BookElements = Guid.Parse("c3333333-3333-4333-8333-333333333030");
    public static readonly Guid BookSoGoodTheyCant = Guid.Parse("c3333333-3333-4333-8333-333333333031");
    public static readonly Guid BookHooked = Guid.Parse("c3333333-3333-4333-8333-333333333032");
    public static readonly Guid BookEmotionalDesign = Guid.Parse("c3333333-3333-4333-8333-333333333033");
    public static readonly Guid BookLeadersEatLast = Guid.Parse("c3333333-3333-4333-8333-333333333034");
    public static readonly Guid BookNexus = Guid.Parse("c3333333-3333-4333-8333-333333333035");
    public static readonly Guid BookAntifragile = Guid.Parse("c3333333-3333-4333-8333-333333333036");
    public static readonly Guid BookOriginals = Guid.Parse("c3333333-3333-4333-8333-333333333037");
    public static readonly Guid BookSwitch = Guid.Parse("c3333333-3333-4333-8333-333333333038");
    public static readonly Guid BookToolsOfTitans = Guid.Parse("c3333333-3333-4333-8333-333333333039");
    public static readonly Guid BookUniverseInNutshell = Guid.Parse("c3333333-3333-4333-8333-33333333303a");
    public static readonly Guid BookPedagogyOppressed = Guid.Parse("c3333333-3333-4333-8333-33333333303b");
    public static readonly Guid BookHowToSolveIt = Guid.Parse("c3333333-3333-4333-8333-33333333303c");

    // Bookings
    public static readonly Guid BookingPsychMoneyActive = Guid.Parse("d4444444-4444-4444-8444-444444444001");
    public static readonly Guid BookingAtomicHabitsReserved = Guid.Parse("d4444444-4444-4444-8444-444444444002");
    public static readonly Guid BookingLeanStartupReturned = Guid.Parse("d4444444-4444-4444-8444-444444444003");
    public static readonly Guid BookingDorianOverdue = Guid.Parse("d4444444-4444-4444-8444-444444444004");
}
