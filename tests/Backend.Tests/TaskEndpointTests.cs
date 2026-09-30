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
    public async Task UpdateTask_Discarding_ClearsCompletedAt()
    {
        var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest("Bericht schreiben", null, null, EffortMinutes.OneDay, null, null));
        var created = await createResponse.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default);

        await client.PutAsJsonAsync(
            $"/api/tasks/{created!.Id}",
            new UpdateTaskRequest("Bericht schreiben", null, GtdStatus.Done, null, EffortMinutes.OneDay, null, null),
            TestJsonOptions.Default);

        var discardResponse = await client.PutAsJsonAsync(
            $"/api/tasks/{created.Id}",
            new UpdateTaskRequest("Bericht schreiben", null, GtdStatus.Discarded, null, EffortMinutes.OneDay, null, null),
            TestJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, discardResponse.StatusCode);
        var discarded = await discardResponse.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default);
        Assert.Equal(GtdStatus.Discarded, discarded!.Status);
        Assert.Null(discarded.CompletedAt);
    }

    [Fact]
    public async Task GetTaskById_WhenMissing_ReturnsNotFound()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/tasks/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTask_PlacesNewTaskAtTop()
    {
        var client = factory.CreateClient();

        var first = await CreateTaskAsync(client, "Erste Aufgabe");
        var second = await CreateTaskAsync(client, "Zweite Aufgabe");

        Assert.True(second.SortOrder < first.SortOrder);
    }

    [Fact]
    public async Task ReorderTasks_ChangesOrderOfTaskList()
    {
        var client = factory.CreateClient();

        var a = await CreateTaskAsync(client, "A");
        var b = await CreateTaskAsync(client, "B");
        var c = await CreateTaskAsync(client, "C");

        var reorderResponse = await client.PutAsJsonAsync(
            "/api/tasks/order",
            new ReorderTasksRequest([a.Id, c.Id, b.Id]));

        Assert.Equal(HttpStatusCode.NoContent, reorderResponse.StatusCode);
        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/api/tasks", TestJsonOptions.Default);
        var ids = tasks!.Select(t => t.Id).Where(id => id == a.Id || id == b.Id || id == c.Id).ToList();
        Assert.Equal([a.Id, c.Id, b.Id], ids);
    }

    [Fact]
    public async Task ReorderTasks_WithUnknownId_ReturnsValidationProblem()
    {
        var client = factory.CreateClient();

        var a = await CreateTaskAsync(client, "A");

        var response = await client.PutAsJsonAsync(
            "/api/tasks/order",
            new ReorderTasksRequest([a.Id, Guid.NewGuid()]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ReorderTasks_WithDuplicateIds_ReturnsValidationProblem()
    {
        var client = factory.CreateClient();

        var a = await CreateTaskAsync(client, "A");

        var response = await client.PutAsJsonAsync(
            "/api/tasks/order",
            new ReorderTasksRequest([a.Id, a.Id]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<TaskDto> CreateTaskAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest(title, null, null, EffortMinutes.TenMinutes, null, null));
        return (await response.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default))!;
    }
}
