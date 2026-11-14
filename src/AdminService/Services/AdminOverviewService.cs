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
        var overdue = await ListBookingsAsync(status: 4, pageSize: AttentionTake, cancellationToken);
        var active = await ListBookingsAsync(status: 1, pageSize: AttentionTake, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var dueSoon = active
            .Where(b => b.DueDate <= now.AddDays(3))
            .OrderBy(b => b.DueDate)
            .ToList();

        return overdue
            .Concat(dueSoon)
            .GroupBy(b => b.Id)
            .Select(g => g.First())
            .OrderBy(b => b.DueDate)
            .Take(AttentionTake)
            .ToList();
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
}
