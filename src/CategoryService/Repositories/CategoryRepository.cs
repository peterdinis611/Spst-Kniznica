using System.Linq.Expressions;
using CategoryService.Data;
using CategoryService.DTOs;
using CategoryService.Exceptions;
using CategoryService.Interfaces;
using CategoryService.Models;
using Microsoft.EntityFrameworkCore;

namespace CategoryService.Repositories;

public class CategoryRepository(CategoryDbContext db) : ICategoryRepository
{
    public async Task<PagedResult<Category>> FindAsync(
        CategoryQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);
        ValidateFilter(filter);

        var query = db.Categories.AsNoTracking().AsQueryable();

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
            var search = filter.Search.Trim();
            query = query.Where(c =>
                EF.Functions.Like(c.Name, $"%{search}%") ||
                (c.Description != null && EF.Functions.Like(c.Description, $"%{search}%")));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        query = ApplySorting(query, filter.SortBy, filter.SortDir);

        var page = Math.Max(filter.Page, 1);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Category>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
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

    private static IQueryable<Category> ApplySorting(IQueryable<Category> query, string? sortBy, string? sortDir)
    {
        var descending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);

        Expression<Func<Category, object>> key = (sortBy ?? "name").Trim().ToLowerInvariant() switch
        {
            "createdat" => c => c.CreatedAt,
            "updatedat" => c => c.UpdatedAt,
            "isactive" => c => c.IsActive,
            _ => c => c.Name
        };

        return descending ? query.OrderByDescending(key) : query.OrderBy(key);
    }

    private static void ValidateFilter(CategoryQueryFilter filter)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        if (filter.Page < 1)
        {
            errors["Page"] = ["Page must be greater than or equal to 1."];
        }

        if (filter.PageSize < 1 || filter.PageSize > 100)
        {
            errors["PageSize"] = ["PageSize must be between 1 and 100."];
        }

        if (errors.Count > 0)
        {
            throw new AppValidationException(
                errors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray(), StringComparer.OrdinalIgnoreCase));
        }
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
