using Backend.Domain;

namespace Backend.Contracts;

public record TaskDto(
    Guid Id,
    string Title,
    string? Notes,
    GtdStatus Status,
    string? Category,
    int EstimatedMinutes,
    DateOnly? DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    Guid? ProjectId,
    int SortOrder)
{
    public static TaskDto FromEntity(TaskItem task) => new(
        task.Id,
        task.Title,
        task.Notes,
        task.Status,
        task.Category,
        task.EstimatedMinutes,
        task.DueDate,
        task.CreatedAt,
        task.CompletedAt,
        task.ProjectId,
        task.SortOrder);
}

public record CreateTaskRequest(
    string Title,
    string? Notes,
    string? Category,
    int EstimatedMinutes,
    DateOnly? DueDate,
    Guid? ProjectId);

public record UpdateTaskRequest(
    string Title,
    string? Notes,
    GtdStatus Status,
    string? Category,
    int EstimatedMinutes,
    DateOnly? DueDate,
    Guid? ProjectId);

public record ReorderTasksRequest(IReadOnlyList<Guid> TaskIds);
