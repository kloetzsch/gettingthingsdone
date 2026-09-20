using Backend.Domain;

namespace Backend.Contracts;

public record CategoryDto(Guid Id, string Name, DateTimeOffset CreatedAt)
{
    public static CategoryDto FromEntity(Category category) => new(
        category.Id,
        category.Name,
        category.CreatedAt);
}

public record CreateCategoryRequest(string Name);
