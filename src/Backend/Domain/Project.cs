namespace Backend.Domain;

public class Project
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Outcome { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<TaskItem> Tasks { get; set; } = [];
}
