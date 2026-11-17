using System.Linq.Expressions;
using CategoryService.Data;
using CategoryService.DTOs;
using CategoryService.Exceptions;
using CategoryService.Interfaces;
using CategoryService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Data;
using SpstKniznica.Common.Pagination;
using SpstKniznica.Common.Text;

namespace CategoryService.Repositories;

public class CategoryRepository(CategoryDbContext db) : ICategoryRepository
{
    private static readonly IReadOnlyDictionary<string, Expression<Func<Category, object>>> SortMap =
        new Dictionary<string, Expression<Func<Category, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["name"] = c => c.Name,
            ["createdat"] = c => c.CreatedAt,
            ["updatedat"] = c => c.UpdatedAt,
            ["isactive"] = c => c.IsActive
        };

    public async Task<PagedResult<Category>> FindAsync(
        CategoryQueryFilter filter,
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

        var query = ApplyCategoryFilters(db.Categories.AsNoTracking(), filter);
        query = query.OrderByProperty(filter.SortBy, filter.IsDescending, SortMap, c => c.Name);
        return await query.ToPagedResultAsync(filter, cancellationToken);
    }

    public async Task<CursorPage<Category>> FindByCursorAsync(
        CategoryCursorFilter filter,
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

        var query = ApplyCategoryFilters(db.Categories.AsNoTracking(), filter);

        if (filter.Cursor is not null && CursorCodec.TryDecode(filter.Cursor, out var cursorId))
        {
            var pivot = await db.Categories.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id.ToString() == cursorId.ToString(), cancellationToken);
            if (pivot is not null)
            {
                query = ApplyCategoryKeyset(query, pivot, filter.SortBy, filter.IsDescending);
            }
        }

        query = query.OrderByPropertyThenById(
            filter.SortBy,
            filter.IsDescending,
            SortMap,
            c => c.Name,
            c => c.Id);

        return await query.ToCursorPageAsync(filter.Limit, c => c.Id, cancellationToken);
    }

    public Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        return db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public Task<Category?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        return db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public Task AddAsync(Category category, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(category);
        return db.Categories.AddAsync(category, cancellationToken).AsTask();
    }

    public void Update(Category category)
    {
        ArgumentNullException.ThrowIfNull(category);
        db.Categories.Update(category);
    }

    public void Remove(Category category)
    {
        ArgumentNullException.ThrowIfNull(category);
        db.Categories.Remove(category);
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
        var query = db.Categories.AsNoTracking()
            .Where(c => c.Name.ToLower() == normalized);

        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(c => c.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    private static IQueryable<Category> ApplyCategoryFilters(
        IQueryable<Category> query,
        CategoryQueryFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            var name = filter.Name.Trim();
            query = query.Where(c => EF.Functions.Like(c.Name, $"%{name}%"));
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == filter.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var folded = TextFold.Fold(filter.Search.Trim());
            query = query.Where(c =>
                EF.Functions.Like(SpstDbFunctions.Fold(c.Name), $"%{folded}%") ||
                (c.Description != null && EF.Functions.Like(SpstDbFunctions.Fold(c.Description), $"%{folded}%")));
        }

        return query;
    }

    private static IQueryable<Category> ApplyCategoryKeyset(
        IQueryable<Category> query,
        Category pivot,
        string sortBy,
        bool descending)
    {
        var pivotId = pivot.Id.ToString();
        var key = string.IsNullOrWhiteSpace(sortBy) ? "name" : sortBy.Trim().ToLowerInvariant();

        return key switch
        {
            "createdat" => descending
                ? query.Where(c =>
                    c.CreatedAt < pivot.CreatedAt ||
                    (c.CreatedAt == pivot.CreatedAt && c.Id.ToString().CompareTo(pivotId) < 0))
                : query.Where(c =>
                    c.CreatedAt > pivot.CreatedAt ||
                    (c.CreatedAt == pivot.CreatedAt && c.Id.ToString().CompareTo(pivotId) > 0)),
            "updatedat" => descending
                ? query.Where(c =>
                    c.UpdatedAt < pivot.UpdatedAt ||
                    (c.UpdatedAt == pivot.UpdatedAt && c.Id.ToString().CompareTo(pivotId) < 0))
                : query.Where(c =>
                    c.UpdatedAt > pivot.UpdatedAt ||
                    (c.UpdatedAt == pivot.UpdatedAt && c.Id.ToString().CompareTo(pivotId) > 0)),
            "id" => descending
                ? query.Where(c => c.Id.ToString().CompareTo(pivotId) < 0)
                : query.Where(c => c.Id.ToString().CompareTo(pivotId) > 0),
            _ => descending
                ? query.Where(c =>
                    c.Name.CompareTo(pivot.Name) < 0 ||
                    (c.Name == pivot.Name && c.Id.ToString().CompareTo(pivotId) < 0))
                : query.Where(c =>
                    c.Name.CompareTo(pivot.Name) > 0 ||
                    (c.Name == pivot.Name && c.Id.ToString().CompareTo(pivotId) > 0)),
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
