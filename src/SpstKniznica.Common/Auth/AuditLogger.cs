using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

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

public sealed class AuditLogger(ILogger<AuditLogger> logger) : IAuditLogger
{
    public void StaffAction(
        ClaimsPrincipal user,
        string action,
        string entityType,
        string entityId,
        object? details = null)
    {
        logger.LogInformation(
            "AUDIT action={Action} entity={EntityType}/{EntityId} actor={ActorHash} roles={Roles} details={@Details}",
            action,
            entityType,
            entityId,
            LogRedaction.HashForLog(user.GetObjectId() ?? user.GetEmail()),
            string.Join(',', user.GetRoles()),
            details);
    }
}

public static class AuditLoggingServiceCollectionExtensions
{
    public static IServiceCollection AddSpstAuditLogging(this IServiceCollection services)
    {
        services.AddSingleton<IAuditLogger, AuditLogger>();
        return services;
    }
}
