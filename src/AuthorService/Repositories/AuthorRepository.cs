using System.Linq.Expressions;
using AuthorService.Data;
using AuthorService.DTOs;
using AuthorService.Exceptions;
using AuthorService.Interfaces;
using AuthorService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Data;
using SpstKniznica.Common.Pagination;
using SpstKniznica.Common.Text;

namespace AuthorService.Repositories;

public class AuthorRepository(AuthorDbContext db) : IAuthorRepository
{
    private static readonly IReadOnlyDictionary<string, Expression<Func<Author, object>>> SortMap =
        new Dictionary<string, Expression<Func<Author, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["name"] = a => a.Name,
            ["nationality"] = a => a.Nationality ?? string.Empty,
            ["birthyear"] = a => a.BirthYear ?? 0,
            ["createdat"] = a => a.CreatedAt,
            ["updatedat"] = a => a.UpdatedAt,
            ["isactive"] = a => a.IsActive
        };

    public async Task<PagedResult<Author>> FindAsync(
        AuthorQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);

        var pagingErrors = filter.Validate();
        if (pagingErrors.Count > 0)
        {
            throw new AppValidationException(
                pagingErrors.ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.OrdinalIgnoreCase));
        }

        filter.Normalize();

        var query = ApplyAuthorFilters(db.Authors.AsNoTracking(), filter);
        query = query.OrderByProperty(filter.SortBy, filter.IsDescending, SortMap, a => a.Name);
        return await query.ToPagedResultAsync(filter, cancellationToken);
    }

    public async Task<CursorPage<Author>> FindByCursorAsync(
        AuthorCursorFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);

        var pagingErrors = filter.Validate();
        if (pagingErrors.Count > 0)
        {
            throw new AppValidationException(
                pagingErrors.ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.OrdinalIgnoreCase));
        }

        filter.Normalize();
        filter.Cursor = string.IsNullOrWhiteSpace(filter.Cursor) ? null : filter.Cursor.Trim();
        if (filter.Cursor is not null && !CursorCodec.TryDecode(filter.Cursor, out _))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Cursor"] = ["Cursor is invalid."]
            });
        }

        var query = ApplyAuthorFilters(db.Authors.AsNoTracking(), filter);

        if (filter.Cursor is not null && CursorCodec.TryDecode(filter.Cursor, out var cursorId))
        {
            var pivot = await db.Authors.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id.ToString() == cursorId.ToString(), cancellationToken);
            if (pivot is not null)
            {
                query = ApplyAuthorKeyset(query, pivot, filter.SortBy, filter.IsDescending);
            }
        }

        query = query.OrderByPropertyThenById(
            filter.SortBy,
            filter.IsDescending,
            SortMap,
            a => a.Name,
            a => a.Id);

        return await query.ToCursorPageAsync(filter.Limit, a => a.Id, cancellationToken);
    }

    public Task<Author?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        var idText = id.ToString();
        return db.Authors.AsNoTracking().FirstOrDefaultAsync(a => a.Id.ToString() == idText, cancellationToken);
    }

    public Task<Author?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        var idText = id.ToString();
        return db.Authors.FirstOrDefaultAsync(a => a.Id.ToString() == idText, cancellationToken);
    }

    public Task AddAsync(Author author, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(author);
        return db.Authors.AddAsync(author, cancellationToken).AsTask();
    }

    public void Update(Author author)
    {
        ArgumentNullException.ThrowIfNull(author);
        db.Authors.Update(author);
    }

    public void Remove(Author author)
    {
        ArgumentNullException.ThrowIfNull(author);
        db.Authors.Remove(author);
    }

    public Task<bool> NameExistsAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Name"] = ["Name is required when checking uniqueness."]
            });
        }

        var normalized = name.Trim().ToLowerInvariant();
        var query = db.Authors.AsNoTracking()
            .Where(a => a.Name.ToLower() == normalized);

        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(a => a.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    private static IQueryable<Author> ApplyAuthorFilters(IQueryable<Author> query, AuthorQueryFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            var name = filter.Name.Trim();
            query = query.Where(a => EF.Functions.Like(a.Name, $"%{name}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.Nationality))
        {
            var nationality = filter.Nationality.Trim();
            query = query.Where(a => a.Nationality != null && EF.Functions.Like(a.Nationality, $"%{nationality}%"));
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(a => a.IsActive == filter.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var folded = TextFold.Fold(filter.Search.Trim());
            query = query.Where(a =>
                EF.Functions.Like(SpstDbFunctions.Fold(a.Name), $"%{folded}%") ||
                (a.Biography != null && EF.Functions.Like(SpstDbFunctions.Fold(a.Biography), $"%{folded}%")) ||
                (a.Nationality != null && EF.Functions.Like(SpstDbFunctions.Fold(a.Nationality), $"%{folded}%")));
        }

        return query;
    }

    private static IQueryable<Author> ApplyAuthorKeyset(
        IQueryable<Author> query,
        Author pivot,
        string sortBy,
        bool descending)
    {
        var pivotId = pivot.Id.ToString();
        var key = string.IsNullOrWhiteSpace(sortBy) ? "name" : sortBy.Trim().ToLowerInvariant();

        return key switch
        {
            "createdat" => descending
                ? query.Where(a =>
                    a.CreatedAt < pivot.CreatedAt ||
                    (a.CreatedAt == pivot.CreatedAt && a.Id.ToString().CompareTo(pivotId) < 0))
                : query.Where(a =>
                    a.CreatedAt > pivot.CreatedAt ||
                    (a.CreatedAt == pivot.CreatedAt && a.Id.ToString().CompareTo(pivotId) > 0)),
            "updatedat" => descending
                ? query.Where(a =>
                    a.UpdatedAt < pivot.UpdatedAt ||
                    (a.UpdatedAt == pivot.UpdatedAt && a.Id.ToString().CompareTo(pivotId) < 0))
                : query.Where(a =>
                    a.UpdatedAt > pivot.UpdatedAt ||
                    (a.UpdatedAt == pivot.UpdatedAt && a.Id.ToString().CompareTo(pivotId) > 0)),
            "id" => descending
                ? query.Where(a => a.Id.ToString().CompareTo(pivotId) < 0)
                : query.Where(a => a.Id.ToString().CompareTo(pivotId) > 0),
            _ => descending
                ? query.Where(a =>
                    a.Name.CompareTo(pivot.Name) < 0 ||
                    (a.Name == pivot.Name && a.Id.ToString().CompareTo(pivotId) < 0))
                : query.Where(a =>
                    a.Name.CompareTo(pivot.Name) > 0 ||
                    (a.Name == pivot.Name && a.Id.ToString().CompareTo(pivotId) > 0)),
        };
    }

    private static void EnsureValidId(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["Id must be a non-empty GUID."]
            });
        }
    }
}
