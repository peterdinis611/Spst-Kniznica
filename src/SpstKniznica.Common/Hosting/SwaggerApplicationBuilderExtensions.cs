using Microsoft.Extensions.Hosting;

namespace SpstKniznica.Common.Hosting;

public static class SwaggerHostingExtensions
{
    /// <summary>
    /// Swagger UI is Development-only.
    /// </summary>
    public static bool ShouldExposeSwagger(this IHostEnvironment environment)
        => environment.IsDevelopment();
}
