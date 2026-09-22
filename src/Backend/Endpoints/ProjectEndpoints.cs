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
        .WithName("GetProjects")
        .WithSummary("Projekte auflisten")
        .WithDescription("Liefert alle Projekte.")
        .Produces<IEnumerable<ProjectDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", async (AppDbContext db, Guid id) =>
        {
            var project = await db.Projects.FindAsync(id);
            return project is null ? Results.NotFound() : Results.Ok(ProjectDto.FromEntity(project));
        })
        .WithName("GetProjectById")
        .WithSummary("Einzelnes Projekt abrufen")
        .WithDescription("Liefert ein Projekt anhand seiner Id.")
        .Produces<ProjectDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

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
        .WithName("CreateProject")
        .WithSummary("Projekt anlegen")
        .WithDescription("Legt ein neues Projekt im Status \"Active\" an.")
        .Produces<ProjectDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem();

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
        .WithName("UpdateProject")
        .WithSummary("Projekt aktualisieren")
        .WithDescription("Aktualisiert Name, gewünschtes Ergebnis und Status eines bestehenden Projekts.")
        .Produces<ProjectDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();

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
        .WithName("DeleteProject")
        .WithSummary("Projekt löschen")
        .WithDescription("Löscht ein Projekt unwiderruflich. Zugehörige Aufgaben bleiben erhalten, verlieren aber ihre Projektzuordnung nicht automatisch.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound);

        return group;
    }
}
