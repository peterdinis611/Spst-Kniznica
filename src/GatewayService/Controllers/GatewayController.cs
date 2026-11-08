using Microsoft.AspNetCore.Mvc;
using Yarp.ReverseProxy.Configuration;

namespace GatewayService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GatewayController(
    IProxyConfigProvider proxyConfig,
    IConfiguration configuration) : ControllerBase
{
    [HttpGet("status")]
    public ActionResult<object> Status()
    {
        var config = proxyConfig.GetConfig();
        return Ok(new
        {
            application = "GatewayService",
            routes = config.Routes.Select(route => new
            {
                route.RouteId,
                path = route.Match.Path,
                clusterId = route.ClusterId
            }),
            clusters = config.Clusters.Select(cluster => new
            {
                cluster.ClusterId,
                destinations = cluster.Destinations?.Select(d => new
                {
                    d.Key,
                    address = d.Value.Address
                })
            }),
            services = new
            {
                books = configuration["Services:BookService"],
                categories = configuration["Services:CategoryService"],
                authors = configuration["Services:AuthorService"],
                bookings = configuration["Services:BookingService"],
                messaging = configuration["Services:MessagingService"],
                cache = configuration["Services:CacheService"]
            }
        });
    }
}
