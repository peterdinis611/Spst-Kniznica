using BookingService.DTOs;
using BookingService.Interfaces;

namespace BookingService.Services;

public sealed class BookingDtoEnricher(IBookCatalogLookup bookCatalog)
{
    public async Task EnrichAsync(
        BookingDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnrichAsync([dto], cancellationToken);
    }

    public async Task EnrichAsync(
        IReadOnlyList<BookingDto> items,
        CancellationToken cancellationToken = default)
    {
        if (items.Count == 0)
        {
            return;
        }

        var map = await bookCatalog.GetBooksAsync(
            items.Select(i => i.BookId),
            cancellationToken);

        foreach (var item in items)
        {
            if (!map.TryGetValue(item.BookId, out var snap))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(snap.Title))
            {
                item.BookTitle = snap.Title;
            }

            if (!string.IsNullOrWhiteSpace(snap.Author))
            {
                item.BookAuthor = snap.Author;
            }
        }
    }
}
