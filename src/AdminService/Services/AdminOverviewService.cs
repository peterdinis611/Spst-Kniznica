using AdminService.DTOs;
using SpstKniznica.Common.Auth;

namespace AdminService.Services;

public sealed class AdminOverviewService(
    AdminDownstreamClient downstream,
    AdminDashboardService dashboard)
{
    private const int AttentionTake = 8;

    public async Task<AdminOverviewDto> GetOverviewAsync(
        System.Security.Claims.ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var healthTask = dashboard.GetDashboardAsync(user, cancellationToken);
        var catalogTask = LoadCatalogAsync(cancellationToken);
        var bookingStatsTask = LoadBookingStatsAsync(cancellationToken);
        var attentionTask = LoadAttentionAsync(cancellationToken);

        await Task.WhenAll(healthTask, catalogTask, bookingStatsTask, attentionTask);

        var health = await healthTask;
        return new AdminOverviewDto
        {
            GeneratedAt = DateTimeOffset.UtcNow.ToString("O"),
            Actor = health.Actor,
            Roles = health.Roles,
            Catalog = await catalogTask,
            Bookings = await bookingStatsTask,
            Services = health.Services,
            HealthyCount = health.HealthyCount,
            UnhealthyCount = health.UnhealthyCount,
            Attention = await attentionTask,
        };
    }

    public async Task<IReadOnlyList<BookingAttentionDto>> GetAttentionAsync(
        CancellationToken cancellationToken)
        => await LoadAttentionAsync(cancellationToken);

    private async Task<CatalogStatsDto> LoadCatalogAsync(CancellationToken cancellationToken)
    {
        var booksTask = CountAsync("Services:BookService", "http://127.0.0.1:5203", "/api/books?page=1&pageSize=1", cancellationToken);
        var availableTask = CountAsync(
            "Services:BookService",
            "http://127.0.0.1:5203",
            "/api/books?page=1&pageSize=1&availableOnly=true",
            cancellationToken);
        var authorsTask = CountAsync("Services:AuthorService", "http://127.0.0.1:5207", "/api/authors?page=1&pageSize=1", cancellationToken);
        var categoriesTask = CountAsync("Services:CategoryService", "http://127.0.0.1:5204", "/api/categories?page=1&pageSize=1", cancellationToken);

        await Task.WhenAll(booksTask, availableTask, authorsTask, categoriesTask);

        var books = await booksTask;
        var available = await availableTask;
        var authors = await authorsTask;
        var categories = await categoriesTask;

        var partial = books is null || available is null || authors is null || categories is null;
        return new CatalogStatsDto
        {
            Books = books ?? 0,
            AvailableBooks = available ?? 0,
            Authors = authors ?? 0,
            Categories = categories ?? 0,
            Partial = partial,
        };
    }

    private async Task<BookingStatsDto> LoadBookingStatsAsync(CancellationToken cancellationToken)
    {
        var totalTask = CountBookingsAsync(null, cancellationToken);
        var reservedTask = CountBookingsAsync(0, cancellationToken);
        var activeTask = CountBookingsAsync(1, cancellationToken);
        var returnedTask = CountBookingsAsync(2, cancellationToken);
        var cancelledTask = CountBookingsAsync(3, cancellationToken);
        var overdueTask = CountBookingsAsync(4, cancellationToken);

        await Task.WhenAll(totalTask, reservedTask, activeTask, returnedTask, cancelledTask, overdueTask);

        var total = await totalTask;
        var reserved = await reservedTask;
        var active = await activeTask;
        var returned = await returnedTask;
        var cancelled = await cancelledTask;
        var overdue = await overdueTask;

        var partial = total is null
            || reserved is null
            || active is null
            || returned is null
            || cancelled is null
            || overdue is null;

        return new BookingStatsDto
        {
            Total = total ?? 0,
            Reserved = reserved ?? 0,
            Active = active ?? 0,
            Returned = returned ?? 0,
            Cancelled = cancelled ?? 0,
            Overdue = overdue ?? 0,
            Partial = partial,
        };
    }

    private async Task<IReadOnlyList<BookingAttentionDto>> LoadAttentionAsync(
        CancellationToken cancellationToken)
    {
        // BookingService desk/daily uses loan policy ReminderDaysBeforeDue for the due-soon window (not a fixed 3-day cutoff).
        var desk = await downstream.GetJsonAsync<DeskDailyResponse>(
            "Services:BookingService",
            "http://127.0.0.1:5208",
            "/api/bookings/desk/daily",
            cancellationToken,
            forwardAuth: true);

        List<BookingAttentionDto> merged;
        if (desk is not null)
        {
            merged = CollectDeskAttention(desk);
        }
        else
        {
            merged = await LoadAttentionFromBookingsListAsync(cancellationToken);
        }

        await EnrichBookTitlesAsync(merged, cancellationToken);
        return merged;
    }

    private static List<BookingAttentionDto> CollectDeskAttention(DeskDailyResponse desk)
    {
        var ranked = new List<(BookingAttentionDto Item, int Rank)>();

        foreach (var item in desk.Overdue.Take(AttentionTake))
        {
            ranked.Add((MapDeskItem(item, "overdue"), 0));
        }

        foreach (var item in desk.DueSoon.Take(AttentionTake))
        {
            ranked.Add((MapDeskItem(item, "dueSoon"), 1));
        }

        foreach (var item in desk.PickupReady.Take(AttentionTake))
        {
            ranked.Add((MapDeskItem(item, "pickup"), 2));
        }

        return ranked
            .GroupBy(x => x.Item.Id)
            .Select(g => g.MinBy(x => x.Rank).Item)
            .OrderBy(x => SectionSortKey(x.Section))
            .ThenBy(x => x.DueDate)
            .Take(AttentionTake)
            .ToList();
    }

    private static int SectionSortKey(string? section) => section switch
    {
        "overdue" => 0,
        "dueSoon" => 1,
        "pickup" => 2,
        _ => 3,
    };

    private static BookingAttentionDto MapDeskItem(DeskBookingItem item, string section) => new()
    {
        Id = item.Id,
        BookId = item.BookId,
        BorrowerName = item.BorrowerName ?? string.Empty,
        BorrowerEmail = item.BorrowerEmail ?? string.Empty,
        Status = item.Status,
        DueDate = item.DueDate,
        Section = section,
    };

    private async Task<List<BookingAttentionDto>> LoadAttentionFromBookingsListAsync(
        CancellationToken cancellationToken)
    {
        var overdue = await ListBookingsAsync(status: 4, pageSize: AttentionTake, cancellationToken);
        var active = await ListBookingsAsync(status: 1, pageSize: AttentionTake, cancellationToken);
        var reserved = await ListBookingsAsync(status: 0, pageSize: AttentionTake, cancellationToken);

        // Fallback when desk/daily is unavailable — uses 3 days for due-soon (policy not reachable here).
        var now = DateTimeOffset.UtcNow;
        var dueSoon = active
            .Where(b => b.DueDate <= now.AddDays(3))
            .Select(b => WithSection(b, "dueSoon"))
            .OrderBy(b => b.DueDate)
            .ToList();

        return overdue.Select(b => WithSection(b, "overdue"))
            .Concat(dueSoon)
            .Concat(reserved.Select(b => WithSection(b, "pickup")))
            .GroupBy(b => b.Id)
            .Select(g => g.First())
            .OrderBy(b => SectionSortKey(b.Section))
            .ThenBy(b => b.DueDate)
            .Take(AttentionTake)
            .ToList();
    }

    private static BookingAttentionDto WithSection(BookingAttentionDto source, string section) => new()
    {
        Id = source.Id,
        BookId = source.BookId,
        BookTitle = source.BookTitle,
        BorrowerName = source.BorrowerName,
        BorrowerEmail = source.BorrowerEmail,
        Status = source.Status,
        DueDate = source.DueDate,
        Section = section,
    };

    private async Task EnrichBookTitlesAsync(
        List<BookingAttentionDto> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            return;
        }

        var bookIds = items.Select(i => i.BookId).Distinct().ToList();
        var titleTasks = bookIds.ToDictionary(
            id => id,
            id => downstream.GetJsonAsync<BookTitleResponse>(
                "Services:BookService",
                "http://127.0.0.1:5203",
                $"/api/books/{id}",
                cancellationToken,
                forwardAuth: false));

        await Task.WhenAll(titleTasks.Values);

        var titles = new Dictionary<Guid, string?>();
        foreach (var (bookId, task) in titleTasks)
        {
            var book = await task;
            titles[bookId] = book?.Title;
        }

        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            if (titles.TryGetValue(item.BookId, out var title) && !string.IsNullOrWhiteSpace(title))
            {
                items[i] = new BookingAttentionDto
                {
                    Id = item.Id,
                    BookId = item.BookId,
                    BookTitle = title,
                    Section = item.Section,
                    BorrowerName = item.BorrowerName,
                    BorrowerEmail = item.BorrowerEmail,
                    Status = item.Status,
                    DueDate = item.DueDate,
                };
            }
        }
    }

    private Task<int?> CountAsync(
        string configKey,
        string fallback,
        string path,
        CancellationToken cancellationToken)
        => CountPathAsync(configKey, fallback, path, forwardAuth: false, cancellationToken);

    private Task<int?> CountBookingsAsync(int? status, CancellationToken cancellationToken)
    {
        var path = status is null
            ? "/api/bookings?page=1&pageSize=1"
            : $"/api/bookings?page=1&pageSize=1&status={status}";
        return CountPathAsync(
            "Services:BookingService",
            "http://127.0.0.1:5208",
            path,
            forwardAuth: true,
            cancellationToken);
    }

    private async Task<int?> CountPathAsync(
        string configKey,
        string fallback,
        string path,
        bool forwardAuth,
        CancellationToken cancellationToken)
    {
        var page = await downstream.GetJsonAsync<CountPage>(
            configKey,
            fallback,
            path,
            cancellationToken,
            forwardAuth);
        return page?.TotalCount;
    }

    private async Task<IReadOnlyList<BookingAttentionDto>> ListBookingsAsync(
        int status,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var page = await downstream.GetJsonAsync<BookingPage>(
            "Services:BookingService",
            "http://127.0.0.1:5208",
            $"/api/bookings?page=1&pageSize={pageSize}&status={status}&sortBy=dueDate&sortDir=asc",
            cancellationToken,
            forwardAuth: true);

        if (page?.Items is null) return [];

        return page.Items.Select(item => new BookingAttentionDto
        {
            Id = item.Id,
            BookId = item.BookId,
            BorrowerName = item.BorrowerName ?? string.Empty,
            BorrowerEmail = item.BorrowerEmail ?? string.Empty,
            Status = item.Status,
            DueDate = item.DueDate,
        }).ToList();
    }

    private sealed class CountPage
    {
        public int TotalCount { get; set; }
    }

    private sealed class BookingPage
    {
        public List<BookingItem> Items { get; set; } = [];
    }

    private sealed class BookingItem
    {
        public Guid Id { get; set; }
        public Guid BookId { get; set; }
        public string? BorrowerName { get; set; }
        public string? BorrowerEmail { get; set; }
        public int Status { get; set; }
        public DateTimeOffset DueDate { get; set; }
    }

    private sealed class DeskDailyResponse
    {
        public List<DeskBookingItem> Overdue { get; set; } = [];
        public List<DeskBookingItem> DueSoon { get; set; } = [];
        public List<DeskBookingItem> PickupReady { get; set; } = [];
    }

    private sealed class DeskBookingItem
    {
        public Guid Id { get; set; }
        public Guid BookId { get; set; }
        public string? BorrowerName { get; set; }
        public string? BorrowerEmail { get; set; }
        public int Status { get; set; }
        public DateTimeOffset DueDate { get; set; }
    }

    private sealed class BookTitleResponse
    {
        public string? Title { get; set; }
    }
}
