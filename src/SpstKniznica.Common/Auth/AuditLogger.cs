using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SpstKniznica.Common.Auth;

public interface IAuditLogger
{
    void StaffAction(
        ClaimsPrincipal user,
        string action,
        string entityType,
        string entityId,
        object? details = null);
}

public sealed class AuditLogger(
    ILogger<AuditLogger> logger,
    IServiceScopeFactory scopeFactory) : IAuditLogger
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public void StaffAction(
        ClaimsPrincipal user,
        string action,
        string entityType,
        string entityId,
        object? details = null)
    {
        var actorId = user.GetObjectId() ?? user.GetEmail();
        var roles = string.Join(',', user.GetRoles());

        logger.LogInformation(
            "AUDIT action={Action} entity={EntityType}/{EntityId} actor={ActorHash} roles={Roles} details={@Details}",
            action,
            entityType,
            entityId,
            LogRedaction.HashForLog(actorId),
            roles,
            details);

        var entry = new AuditEntry
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            ActorIdHash = LogRedaction.HashForLog(actorId),
            ActorEmail = user.GetEmail(),
            ActorName = user.GetDisplayName(),
            Roles = roles,
            DetailsJson = details is null
                ? null
                : JsonSerializer.Serialize(details, JsonOptions),
        };

        try
        {
            using var scope = scopeFactory.CreateScope();
            foreach (var sink in scope.ServiceProvider.GetServices<IAuditSink>())
            {
                sink.WriteAsync(entry).GetAwaiter().GetResult();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Audit sink failed for action {Action}", action);
        }
    }
}

public sealed class HttpAdminAuditSink(
    HttpClient httpClient,
    IOptions<AdminAuditOptions> options,
    IOptions<InternalApiOptions> internalApi,
    ILogger<HttpAdminAuditSink> logger) : IAuditSink
{
    public async Task WriteAsync(AuditEntry entry, CancellationToken cancellationToken = default)
    {
        var opts = options.Value;
        if (!opts.Enabled || string.IsNullOrWhiteSpace(opts.BaseUrl))
        {
            return;
        }

        var baseUrl = opts.BaseUrl.TrimEnd('/');
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{baseUrl}/api/internal/audit");
        request.Content = JsonContent.Create(entry);

        var key = internalApi.Value.SharedKey;
        if (!string.IsNullOrWhiteSpace(key))
        {
            request.Headers.TryAddWithoutValidation(InternalApiOptions.HeaderName, key);
        }

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogDebug(
                    "Admin audit ingest returned {Status} for {Action}",
                    (int)response.StatusCode,
                    entry.Action);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Admin audit ingest unreachable for {Action}", entry.Action);
        }
    }
}

file sealed class SourcedAuditSink(IAuditSink inner, string? sourceService) : IAuditSink
{
    public Task WriteAsync(AuditEntry entry, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entry.SourceService) && !string.IsNullOrWhiteSpace(sourceService))
        {
            entry = new AuditEntry
            {
                Id = entry.Id,
                OccurredAt = entry.OccurredAt,
                Action = entry.Action,
                EntityType = entry.EntityType,
                EntityId = entry.EntityId,
                ActorIdHash = entry.ActorIdHash,
                ActorEmail = entry.ActorEmail,
                ActorName = entry.ActorName,
                Roles = entry.Roles,
                DetailsJson = entry.DetailsJson,
                SourceService = sourceService,
            };
        }

        return inner.WriteAsync(entry, cancellationToken);
    }
}

public static class AuditLoggingServiceCollectionExtensions
{
    public static IServiceCollection AddSpstAuditLogging(this IServiceCollection services)
    {
        services.AddSingleton<IAuditLogger, AuditLogger>();
        return services;
    }

    /// <summary>
    /// Forward staff audit events to AdminService (SQLite audit log store).
    /// </summary>
    public static IServiceCollection AddSpstAuditLoggingToAdmin(
        this IServiceCollection services,
        IConfiguration configuration,
        string? sourceService = null)
    {
        services.AddSpstAuditLogging();
        services.Configure<AdminAuditOptions>(configuration.GetSection(AdminAuditOptions.SectionName));
        services.AddHttpClient<HttpAdminAuditSink>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(3);
        });
        services.AddTransient<IAuditSink>(sp =>
            new SourcedAuditSink(
                sp.GetRequiredService<HttpAdminAuditSink>(),
                sourceService));
        return services;
    }
}
