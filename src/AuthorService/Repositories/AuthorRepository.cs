using System.Linq.Expressions;
using AuthorService.Data;
using AuthorService.DTOs;
using AuthorService.Exceptions;
using AuthorService.Interfaces;
using AuthorService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Pagination;

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

        var query = db.Authors.AsNoTracking().AsQueryable();

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
            var search = filter.Search;
            query = query.Where(a =>
                EF.Functions.Like(a.Name, $"%{search}%") ||
                (a.Biography != null && EF.Functions.Like(a.Biography, $"%{search}%")) ||
                (a.Nationality != null && EF.Functions.Like(a.Nationality, $"%{search}%")));
        }

        query = query.OrderByProperty(filter.SortBy, filter.IsDescending, SortMap, a => a.Name);
        return await query.ToPagedResultAsync(filter, cancellationToken);
    }

    public Task<Author?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        return db.Authors.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public Task<Author?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        return db.Authors.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
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
