using Backend.Contracts;
using Backend.Data;
using Backend.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class CategoryEndpoints
{
    public static RouteGroupBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/categories").WithTags("Categories");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var categories = await db.Categories.OrderBy(c => c.Name).ToListAsync();
            return Results.Ok(categories.Select(CategoryDto.FromEntity));
        })
        .WithName("GetCategories");

        group.MapPost("/", async (AppDbContext db, [FromBody] CreateCategoryRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.Name)] = ["Name is required."],
                });
            }

            if (await db.Categories.AnyAsync(c => c.Name == request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.Name)] = ["A category with this name already exists."],
                });
            }

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            db.Categories.Add(category);
            await db.SaveChangesAsync();

            return Results.Created($"/api/categories/{category.Id}", CategoryDto.FromEntity(category));
        })
        .WithName("CreateCategory");

        group.MapDelete("/{id:guid}", async (AppDbContext db, Guid id) =>
        {
            var category = await db.Categories.FindAsync(id);
            if (category is null)
            {
                return Results.NotFound();
            }

            db.Categories.Remove(category);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteCategory");

        return group;
    }
}
