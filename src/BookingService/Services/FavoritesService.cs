using BookingService.Data;
using BookingService.DTOs;
using BookingService.Exceptions;
using BookingService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Text;

namespace BookingService.Services;

public sealed class FavoritesService(BookingDbContext db, ILogger<FavoritesService> logger)
{
    public async Task<IReadOnlyList<FavoriteBookDto>> ListAsync(
        string ownerEmail,
        string? listName = null,
        CancellationToken cancellationToken = default)
    {
        var email = ownerEmail.Trim().ToLowerInvariant();
        var query = db.Favorites.AsNoTracking().Where(f => f.OwnerEmail == email);
        if (!string.IsNullOrWhiteSpace(listName))
        {
            var name = listName.Trim();
            query = query.Where(f => f.ListName == name);
        }

        var items = await query.OrderByDescending(f => f.CreatedAt).ToListAsync(cancellationToken);
        return items.Select(Map).ToList();
    }

    public async Task<FavoriteBookDto> AddAsync(
        string ownerEmail,
        AddFavoriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.BookId == Guid.Empty)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["BookId"] = ["BookId is required."]
            });
        }

        var email = ownerEmail.Trim().ToLowerInvariant();
        var listName = string.IsNullOrWhiteSpace(request.ListName)
            ? "Obľúbené"
            : StringNormalize.Required(request.ListName);

        var existing = await db.Favorites.AsNoTracking()
            .FirstOrDefaultAsync(
                f => f.OwnerEmail == email && f.BookId == request.BookId && f.ListName == listName,
                cancellationToken);
        if (existing is not null)
        {
            return Map(existing);
        }

        var favorite = new FavoriteBook
        {
            Id = Guid.NewGuid(),
            OwnerEmail = email,
            BookId = request.BookId,
            ListName = listName,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Favorites.Add(favorite);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Favorite {FavoriteId} added for {Email} book {BookId}", favorite.Id, email, request.BookId);
        return Map(favorite);
    }

    public async Task RemoveAsync(
        Guid id,
        string ownerEmail,
        CancellationToken cancellationToken = default)
    {
        var email = ownerEmail.Trim().ToLowerInvariant();
        var favorite = await db.Favorites.FirstOrDefaultAsync(
            f => f.Id == id && f.OwnerEmail == email,
            cancellationToken) ?? throw new NotFoundException($"Favorite '{id}' was not found.");

        db.Favorites.Remove(favorite);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveByBookAsync(
        Guid bookId,
        string ownerEmail,
        string? listName,
        CancellationToken cancellationToken = default)
    {
        var email = ownerEmail.Trim().ToLowerInvariant();
        var name = string.IsNullOrWhiteSpace(listName) ? "Obľúbené" : listName.Trim();
        var favorite = await db.Favorites.FirstOrDefaultAsync(
            f => f.OwnerEmail == email && f.BookId == bookId && f.ListName == name,
            cancellationToken);
        if (favorite is null) return;
        db.Favorites.Remove(favorite);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static FavoriteBookDto Map(FavoriteBook favorite) => new()
    {
        Id = favorite.Id,
        BookId = favorite.BookId,
        ListName = favorite.ListName,
        CreatedAt = favorite.CreatedAt,
    };
}
