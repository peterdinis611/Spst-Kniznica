namespace AdminService.Services;

internal static class ServiceTargets
{
    internal static readonly (string Name, string ConfigKey, string Fallback)[] All =
    [
        ("AuthService", "Services:AuthService", "http://127.0.0.1:5210"),
        ("BookService", "Services:BookService", "http://127.0.0.1:5203"),
        ("CategoryService", "Services:CategoryService", "http://127.0.0.1:5204"),
        ("AuthorService", "Services:AuthorService", "http://127.0.0.1:5207"),
        ("BookingService", "Services:BookingService", "http://127.0.0.1:5208"),
        ("WorkersService", "Services:WorkersService", "http://127.0.0.1:5209"),
        ("MessagingService", "Services:MessagingService", "http://127.0.0.1:5205"),
        ("CacheService", "Services:CacheService", "http://127.0.0.1:5206"),
        ("GatewayService", "Services:GatewayService", "http://127.0.0.1:5200"),
    ];

    internal static string BaseUrl(IConfiguration configuration, string configKey, string fallback)
        => (configuration[configKey] ?? fallback).TrimEnd('/');
}
