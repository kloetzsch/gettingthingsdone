using Backend.Contracts;
using Backend.Data;
using Backend.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class TaskEndpoints
{
    public static RouteGroupBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        group.MapGet("/", async (AppDbContext db, GtdStatus? status, Guid? projectId) =>
        {
            var query = db.Tasks.AsQueryable();

            if (status is not null)
            {
                query = query.Where(t => t.Status == status);
            }

            if (projectId is not null)
            {
                query = query.Where(t => t.ProjectId == projectId);
            }

            var tasks = await query.OrderBy(t => t.CreatedAt).ToListAsync();
            return Results.Ok(tasks.Select(TaskDto.FromEntity));
        })
        .WithName("GetTasks")
        .WithSummary("Aufgaben auflisten")
        .WithDescription("Liefert alle Aufgaben, optional gefiltert nach GTD-Status und/oder Projekt.")
        .Produces<IEnumerable<TaskDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", async (AppDbContext db, Guid id) =>
        {
            var task = await db.Tasks.FindAsync(id);
            return task is null ? Results.NotFound() : Results.Ok(TaskDto.FromEntity(task));
        })
        .WithName("GetTaskById")
        .WithSummary("Einzelne Aufgabe abrufen")
        .WithDescription("Liefert eine Aufgabe anhand ihrer Id.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (AppDbContext db, [FromBody] CreateTaskRequest request) =>
        {
            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                errors[nameof(request.Title)] = ["Title is required."];
            }

            if (!EffortMinutes.AllowedValues.Contains(request.EstimatedMinutes))
            {
                errors[nameof(request.EstimatedMinutes)] =
                    [$"Must be one of: {string.Join(", ", EffortMinutes.AllowedValues.Order())}."];
            }

            if (request.ProjectId is not null && !await db.Projects.AnyAsync(p => p.Id == request.ProjectId))
            {
                errors[nameof(request.ProjectId)] = ["Project does not exist."];
            }

            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var task = new TaskItem
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Notes = request.Notes,
                Category = request.Category,
                EstimatedMinutes = request.EstimatedMinutes,
                DueDate = request.DueDate,
                ProjectId = request.ProjectId,
                Status = GtdStatus.Inbox,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            db.Tasks.Add(task);
            await db.SaveChangesAsync();

            return Results.Created($"/api/tasks/{task.Id}", TaskDto.FromEntity(task));
        })
        .WithName("CreateTask")
        .WithSummary("Aufgabe anlegen")
        .WithDescription("Legt eine neue Aufgabe im Status \"Inbox\" an. estimatedMinutes muss einem der erlaubten Aufwandswerte entsprechen.")
        .Produces<TaskDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem();

        group.MapPut("/{id:guid}", async (AppDbContext db, Guid id, [FromBody] UpdateTaskRequest request) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task is null)
            {
                return Results.NotFound();
            }

            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                errors[nameof(request.Title)] = ["Title is required."];
            }

            if (!EffortMinutes.AllowedValues.Contains(request.EstimatedMinutes))
            {
                errors[nameof(request.EstimatedMinutes)] =
                    [$"Must be one of: {string.Join(", ", EffortMinutes.AllowedValues.Order())}."];
            }

            if (request.ProjectId is not null && !await db.Projects.AnyAsync(p => p.Id == request.ProjectId))
            {
                errors[nameof(request.ProjectId)] = ["Project does not exist."];
            }

            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            task.Title = request.Title;
            task.Notes = request.Notes;
            task.Category = request.Category;
            task.EstimatedMinutes = request.EstimatedMinutes;
            task.DueDate = request.DueDate;
            task.ProjectId = request.ProjectId;

            if (task.Status != GtdStatus.Done && request.Status == GtdStatus.Done)
            {
                task.CompletedAt = DateTimeOffset.UtcNow;
            }
            else if (request.Status != GtdStatus.Done)
            {
                task.CompletedAt = null;
            }

            task.Status = request.Status;

            await db.SaveChangesAsync();

            return Results.Ok(TaskDto.FromEntity(task));
        })
        .WithName("UpdateTask")
        .WithSummary("Aufgabe aktualisieren")
        .WithDescription("Aktualisiert eine bestehende Aufgabe vollständig, inkl. Status. Setzt/löscht completedAt automatisch beim Wechsel nach/aus \"Done\". Verworfene Aufgaben (\"Discarded\") haben kein completedAt.")
        .Produces<TaskDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();

        group.MapDelete("/{id:guid}", async (AppDbContext db, Guid id) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task is null)
            {
                return Results.NotFound();
            }

            db.Tasks.Remove(task);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteTask")
        .WithSummary("Aufgabe löschen")
        .WithDescription("Löscht eine Aufgabe unwiderruflich.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound);

        return group;
    }
}
