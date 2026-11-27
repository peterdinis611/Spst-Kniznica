using BookService.Data;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Hosting;

namespace BookService.Services;

/// <summary>
/// Periodically recounts <see cref="Book.AvailableCopies"/> from copy rows.
/// Heals temporary Book↔Booking lag after outages / missed events.
/// </summary>
public sealed class AvailableCopiesReconcileHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<AvailableCopiesReconcileHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);
    private const int BatchSize = 200;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Let the API finish startup before the first pass.
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ReconcileAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "AvailableCopies reconcile cycle failed");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task ReconcileAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<BookDbContext>();
        var metrics = scope.ServiceProvider.GetService<RequestMetrics>();

        var bookIds = await db.Books
            .AsNoTracking()
            .Select(b => b.Id)
            .Take(BatchSize * 20)
            .ToListAsync(cancellationToken);

        var fixedCount = 0;
        foreach (var chunk in bookIds.Chunk(BatchSize))
        {
            var books = await db.Books
                .Include(b => b.Copies)
                .Where(b => chunk.Contains(b.Id))
                .ToListAsync(cancellationToken);

            var dirty = 0;
            foreach (var book in books)
            {
                var beforeAvailable = book.AvailableCopies;
                var beforeTotal = book.TotalCopies;
                book.RecalculateCopyCounts();
                if (book.AvailableCopies == beforeAvailable && book.TotalCopies == beforeTotal)
                {
                    continue;
                }

                book.UpdatedAt = DateTimeOffset.UtcNow;
                dirty++;
                fixedCount++;
                logger.LogWarning(
                    "Reconciled book {BookId} copies: available {BeforeA}→{AfterA}, total {BeforeT}→{AfterT}",
                    book.Id,
                    beforeAvailable,
                    book.AvailableCopies,
                    beforeTotal,
                    book.TotalCopies);
            }

            if (dirty > 0)
            {
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        metrics?.SetGauge("catalog_copies_reconciled", fixedCount);
        if (fixedCount > 0)
        {
            metrics?.IncrementCounter("catalog_copies_reconcile_fixes", fixedCount);
            logger.LogInformation("Reconciled {Count} book copy counters", fixedCount);
        }
    }
}
