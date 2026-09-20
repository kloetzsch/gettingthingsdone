using System.Net;
using System.Net.Http.Json;
using Backend.Contracts;
using Backend.Domain;

namespace Backend.Tests;

public class CategoryEndpointTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task CreateCategory_ThenListCategories_ReturnsIt()
    {
        var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Haushalt"));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>(TestJsonOptions.Default);

        var listResponse = await client.GetAsync("/api/categories");
        var categories = await listResponse.Content.ReadFromJsonAsync<List<CategoryDto>>(TestJsonOptions.Default);

        Assert.Contains(categories!, c => c.Id == created!.Id);
    }

    [Fact]
    public async Task CreateCategory_WithDuplicateName_ReturnsValidationProblem()
    {
        var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Finanzen"));
        var response = await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Finanzen"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteCategory_DoesNotAffectExistingTaskSnapshot()
    {
        var client = factory.CreateClient();

        var category = await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Nebenprojekt"));
        var categoryDto = await category.Content.ReadFromJsonAsync<CategoryDto>(TestJsonOptions.Default);

        var task = await client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest("Regal aufbauen", null, categoryDto!.Name, EffortMinutes.SixtyMinutes, null, null));
        var taskDto = await task.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default);

        var deleteResponse = await client.DeleteAsync($"/api/categories/{categoryDto.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var taskAfterDelete = await client.GetAsync($"/api/tasks/{taskDto!.Id}");
        var taskAfterDeleteDto = await taskAfterDelete.Content.ReadFromJsonAsync<TaskDto>(TestJsonOptions.Default);

        Assert.Equal("Nebenprojekt", taskAfterDeleteDto!.Category);
    }
}
