namespace Backend.Domain;

public class Category
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
