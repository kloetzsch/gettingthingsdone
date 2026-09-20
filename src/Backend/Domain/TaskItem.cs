namespace Backend.Domain;

public class TaskItem
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Notes { get; set; }
    public GtdStatus Status { get; set; } = GtdStatus.Inbox;
    public string? Category { get; set; }
    public int EstimatedMinutes { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
}
