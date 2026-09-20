using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Backend.Tests;

public class HealthEndpointTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task GetHealth_ReturnsOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
