using AdminService.Data;
using AdminService.DTOs;
using AdminService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Pagination;

namespace AdminService.Services;

public sealed class AuditLogService(AdminDbContext db, ILogger<AuditLogService> logger) : IAuditSink
{
    public async Task WriteAsync(AuditEntry entry, CancellationToken cancellationToken = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Id = entry.Id == Guid.Empty ? Guid.NewGuid() : entry.Id,
            OccurredAt = entry.OccurredAt == default ? DateTimeOffset.UtcNow : entry.OccurredAt,
            Action = TruncateRequired(entry.Action, 120),
            EntityType = TruncateRequired(entry.EntityType, 80),
            EntityId = TruncateRequired(entry.EntityId, 200),
            ActorIdHash = Truncate(entry.ActorIdHash, 128),
            ActorEmail = Truncate(entry.ActorEmail, 256),
            ActorName = Truncate(entry.ActorName, 200),
            Roles = TruncateRequired(entry.Roles, 256),
            DetailsJson = Truncate(entry.DetailsJson, 4000),
            SourceService = Truncate(entry.SourceService, 80),
        });

        await db.SaveChangesAsync(cancellationToken);
        logger.LogDebug("Stored audit {Action} {EntityType}/{EntityId}", entry.Action, entry.EntityType, entry.EntityId);
    }

    public async Task IngestAsync(IngestAuditRequest request, CancellationToken cancellationToken = default)
    {
        await WriteAsync(
            new AuditEntry
            {
                Id = request.Id is { } id && id != Guid.Empty ? id : Guid.NewGuid(),
                OccurredAt = request.OccurredAt ?? DateTimeOffset.UtcNow,
                Action = request.Action,
                EntityType = request.EntityType,
                EntityId = request.EntityId,
                ActorIdHash = request.ActorIdHash,
                ActorEmail = request.ActorEmail,
                ActorName = request.ActorName,
                Roles = request.Roles ?? string.Empty,
                DetailsJson = request.DetailsJson,
                SourceService = request.SourceService,
            },
            cancellationToken);
    }

    public async Task<PagedResult<AuditLogDto>> SearchAsync(
        AuditLogQuery query,
        CancellationToken cancellationToken = default)
    {
        query.Normalize();

        var q = db.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var action = query.Action.Trim();
            q = q.Where(x => x.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(query.EntityType))
        {
            var type = query.EntityType.Trim();
            q = q.Where(x => x.EntityType == type);
        }

        if (!string.IsNullOrWhiteSpace(query.ActorEmail))
        {
            var email = query.ActorEmail.Trim().ToLowerInvariant();
            q = q.Where(x => x.ActorEmail != null && x.ActorEmail.ToLower() == email);
        }

        if (!string.IsNullOrWhiteSpace(query.SourceService))
        {
            var source = query.SourceService.Trim();
            q = q.Where(x => x.SourceService == source);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search;
            q = q.Where(x =>
                EF.Functions.Like(x.Action, $"%{search}%") ||
                EF.Functions.Like(x.EntityType, $"%{search}%") ||
                EF.Functions.Like(x.EntityId, $"%{search}%") ||
                (x.ActorEmail != null && EF.Functions.Like(x.ActorEmail, $"%{search}%")) ||
                (x.ActorName != null && EF.Functions.Like(x.ActorName, $"%{search}%")) ||
                (x.SourceService != null && EF.Functions.Like(x.SourceService, $"%{search}%")));
        }

        var items = await q.ToListAsync(cancellationToken);
        var sorted = Sort(items, query.SortBy, query.IsDescending);
        var total = sorted.Count;
        var pageItems = sorted
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(Map)
            .ToList();

        return new PagedResult<AuditLogDto>
        {
            Items = pageItems,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total,
        };
    }

    public async Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await db.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return item is null ? null : Map(item);
    }

    private static List<AuditLog> Sort(IReadOnlyList<AuditLog> items, string sortBy, bool desc)
    {
        Func<AuditLog, IComparable> key = sortBy.Trim().ToLowerInvariant() switch
        {
            "action" => x => x.Action,
            "entitytype" => x => x.EntityType,
            "entityid" => x => x.EntityId,
            "actoremail" => x => x.ActorEmail ?? string.Empty,
            "sourceservice" => x => x.SourceService ?? string.Empty,
            _ => x => x.OccurredAt.UtcTicks,
        };

        return desc
            ? items.OrderByDescending(key).ToList()
            : items.OrderBy(key).ToList();
    }

    private static AuditLogDto Map(AuditLog x) => new()
    {
        Id = x.Id,
        OccurredAt = x.OccurredAt,
        Action = x.Action,
        EntityType = x.EntityType,
        EntityId = x.EntityId,
        ActorIdHash = x.ActorIdHash,
        ActorEmail = x.ActorEmail,
        ActorName = x.ActorName,
        Roles = x.Roles,
        DetailsJson = x.DetailsJson,
        SourceService = x.SourceService,
    };

    private static string TruncateRequired(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        return value.Length <= max ? value : value[..max];
    }

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= max ? value : value[..max];
    }
}
