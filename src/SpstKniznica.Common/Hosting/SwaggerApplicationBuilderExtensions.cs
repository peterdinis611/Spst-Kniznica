using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

namespace SpstKniznica.Common.Hosting;

public static class SwaggerApplicationBuilderExtensions
{
    /// <summary>
    /// Registers Swagger UI only in Development.
    /// </summary>
    public static WebApplication UseSpstSwagger(
        this WebApplication app,
        string documentTitle,
        Action<Swashbuckle.AspNetCore.SwaggerUI.SwaggerUIOptions>? configure = null)
    {
        if (!app.Environment.IsDevelopment())
        {
            return app;
        }

        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", documentTitle);
            options.RoutePrefix = "swagger";
            configure?.Invoke(options);
        });

        return app;
    }
}
