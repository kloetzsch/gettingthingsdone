using System.Net;
using System.Net.Http.Json;
using Backend.Contracts;
using Backend.Domain;

namespace Backend.Tests;

public class TaskEndpointTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task CreateTask_DefaultsToInboxStatus()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest("Milch kaufen", null, null, EffortMinutes.TenMinutes, null, null));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var task = await response.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default);
        Assert.NotNull(task);
        Assert.Equal(GtdStatus.Inbox, task!.Status);
    }

    [Fact]
    public async Task CreateTask_WithoutTitle_ReturnsValidationProblem()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest("", null, null, EffortMinutes.TenMinutes, null, null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTask_WithInvalidEstimatedMinutes_ReturnsValidationProblem()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest("Bericht schreiben", null, null, 42, null, null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTask_MarkingDone_SetsCompletedAt()
    {
        var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest("Bericht schreiben", null, null, EffortMinutes.OneDay, null, null));
        var created = await createResponse.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/tasks/{created!.Id}",
            new UpdateTaskRequest("Bericht schreiben", null, GtdStatus.Done, null, EffortMinutes.OneDay, null, null),
            TestJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default);
        Assert.NotNull(updated!.CompletedAt);
    }

    [Fact]
    public async Task GetTaskById_WhenMissing_ReturnsNotFound()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/tasks/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
