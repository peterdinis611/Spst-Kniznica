using System.Linq.Expressions;
using CategoryService.Data;
using CategoryService.DTOs;
using CategoryService.Exceptions;
using CategoryService.Interfaces;
using CategoryService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Pagination;

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
            var search = filter.Search;
            query = query.Where(c =>
                EF.Functions.Like(c.Name, $"%{search}%") ||
                (c.Description != null && EF.Functions.Like(c.Description, $"%{search}%")));
        }

        query = query.OrderByProperty(filter.SortBy, filter.IsDescending, SortMap, c => c.Name);
        return await query.ToPagedResultAsync(filter, cancellationToken);
    }

    public Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        var idText = id.ToString();
        return db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id.ToString() == idText, cancellationToken);
    }

    public Task<Category?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        var idText = id.ToString();
        return db.Categories.FirstOrDefaultAsync(c => c.Id.ToString() == idText, cancellationToken);
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
