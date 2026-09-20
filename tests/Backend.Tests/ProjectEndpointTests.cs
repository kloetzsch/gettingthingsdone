using System.Net;
using System.Net.Http.Json;
using Backend.Contracts;
using Backend.Domain;

namespace Backend.Tests;

public class ProjectEndpointTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task CreateProject_ThenListProjects_ReturnsIt()
    {
        var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Umzug organisieren", "In der neuen Wohnung eingerichtet sein"));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ProjectDto>(TestJsonOptions.Default);

        var listResponse = await client.GetAsync("/api/projects");
        var projects = await listResponse.Content.ReadFromJsonAsync<List<ProjectDto>>(TestJsonOptions.Default);

        Assert.Contains(projects!, p => p.Id == created!.Id);
    }

    [Fact]
    public async Task CreateTask_WithUnknownProjectId_ReturnsValidationProblem()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest("Kisten packen", null, null, EffortMinutes.TenMinutes, null, Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
