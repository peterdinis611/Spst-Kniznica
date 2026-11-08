using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Caching;

namespace CacheService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CacheController(IAppCache cache) : ControllerBase
{
    [HttpGet("status")]
    public ActionResult<object> Status([FromServices] IConfiguration configuration)
    {
        return Ok(new
        {
            application = "CacheService",
            enabled = cache.IsEnabled,
            connection = configuration["Cache:ConnectionString"],
            instanceName = configuration["Cache:InstanceName"],
            defaultTtlSeconds = configuration.GetValue("Cache:DefaultTtlSeconds", 300)
        });
    }

    [HttpGet("keys")]
    public async Task<ActionResult<IReadOnlyList<string>>> ListKeys(
        [FromQuery] string? pattern,
        CancellationToken cancellationToken)
    {
        return Ok(await cache.ListKeysAsync(pattern, cancellationToken));
    }

    [HttpGet("{*key}")]
    public async Task<IActionResult> Get(string key, CancellationToken cancellationToken)
    {
        var value = await cache.GetAsync<JsonElement?>(key, cancellationToken);
        if (value is null)
        {
            return NotFound(new { key, found = false });
        }

        return Ok(new { key, found = true, value });
    }

    [HttpPut("{*key}")]
    public async Task<IActionResult> Set(
        string key,
        [FromBody] SetCacheRequest request,
        CancellationToken cancellationToken)
    {
        var ttl = request.TtlSeconds is > 0
            ? TimeSpan.FromSeconds(request.TtlSeconds.Value)
            : (TimeSpan?)null;

        await cache.SetAsync(key, request.Value, ttl, cancellationToken);
        return Accepted(new { key, stored = true, ttlSeconds = request.TtlSeconds });
    }

    [HttpDelete("{*key}")]
    public async Task<IActionResult> Remove(string key, CancellationToken cancellationToken)
    {
        await cache.RemoveAsync(key, cancellationToken);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> RemoveByPrefix(
        [FromQuery] string prefix,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(prefix))
        {
            return BadRequest(new { error = "Query parameter 'prefix' is required." });
        }

        await cache.RemoveByPrefixAsync(prefix, cancellationToken);
        return NoContent();
    }
}

public class SetCacheRequest
{
    public required JsonElement Value { get; set; }
    public int? TtlSeconds { get; set; }
}
