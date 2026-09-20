using Backend.Domain;

namespace Backend.Contracts;

public record ProjectDto(
    Guid Id,
    string Name,
    string? Outcome,
    ProjectStatus Status,
    DateTimeOffset CreatedAt)
{
    public static ProjectDto FromEntity(Project project) => new(
        project.Id,
        project.Name,
        project.Outcome,
        project.Status,
        project.CreatedAt);
}

public record CreateProjectRequest(string Name, string? Outcome);

public record UpdateProjectRequest(string Name, string? Outcome, ProjectStatus Status);
