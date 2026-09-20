using Backend.Contracts;
using Backend.Data;
using Backend.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class ProjectEndpoints
{
    public static RouteGroupBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects").WithTags("Projects");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var projects = await db.Projects.OrderBy(p => p.CreatedAt).ToListAsync();
            return Results.Ok(projects.Select(ProjectDto.FromEntity));
        })
        .WithName("GetProjects");

        group.MapGet("/{id:guid}", async (AppDbContext db, Guid id) =>
        {
            var project = await db.Projects.FindAsync(id);
            return project is null ? Results.NotFound() : Results.Ok(ProjectDto.FromEntity(project));
        })
        .WithName("GetProjectById");

        group.MapPost("/", async (AppDbContext db, [FromBody] CreateProjectRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.Name)] = ["Name is required."],
                });
            }

            var project = new Project
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Outcome = request.Outcome,
                Status = ProjectStatus.Active,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            db.Projects.Add(project);
            await db.SaveChangesAsync();

            return Results.Created($"/api/projects/{project.Id}", ProjectDto.FromEntity(project));
        })
        .WithName("CreateProject");

        group.MapPut("/{id:guid}", async (AppDbContext db, Guid id, [FromBody] UpdateProjectRequest request) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null)
            {
                return Results.NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.Name)] = ["Name is required."],
                });
            }

            project.Name = request.Name;
            project.Outcome = request.Outcome;
            project.Status = request.Status;

            await db.SaveChangesAsync();

            return Results.Ok(ProjectDto.FromEntity(project));
        })
        .WithName("UpdateProject");

        group.MapDelete("/{id:guid}", async (AppDbContext db, Guid id) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null)
            {
                return Results.NotFound();
            }

            db.Projects.Remove(project);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteProject");

        return group;
    }
}
