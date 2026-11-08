namespace SpstKniznica.Common.Messaging;

public abstract record IntegrationEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
    public string EventType => GetType().Name;
}

public sealed record BookCreatedEvent(
    Guid BookId,
    string Title,
    string Author,
    string? Isbn,
    Guid? CategoryId,
    string? CategoryName) : IntegrationEvent;

public sealed record BookUpdatedEvent(
    Guid BookId,
    string Title,
    string Author,
    string? Isbn,
    Guid? CategoryId,
    string? CategoryName) : IntegrationEvent;

public sealed record BookDeletedEvent(Guid BookId) : IntegrationEvent;

public sealed record CategoryCreatedEvent(
    Guid CategoryId,
    string Name,
    string? Description,
    bool IsActive) : IntegrationEvent;

public sealed record CategoryUpdatedEvent(
    Guid CategoryId,
    string Name,
    string? Description,
    bool IsActive) : IntegrationEvent;

public sealed record CategoryDeletedEvent(Guid CategoryId) : IntegrationEvent;

public sealed record PingEvent(string Source, string Message) : IntegrationEvent;
