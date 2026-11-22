using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SpstKniznica.Common.Hosting;

/// <summary>
/// Browser freshness for anonymous catalog GETs. Book detail stays private:
/// the body includes inventory numbers for staff and hides them for everyone else.
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class PublicCatalogCacheAttribute : ResultFilterAttribute
{
    public const int MaxAgeSeconds = 15;

    public bool Private { get; set; }

    public override void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is not (OkObjectResult or OkResult))
        {
            return;
        }

        var visibility = Private ? "private" : "public";
        context.HttpContext.Response.Headers.CacheControl =
            $"{visibility}, max-age={MaxAgeSeconds}";
    }
}
