using SpstKniznica.Common.Pagination;

namespace CategoryService.DTOs;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public interface ICategoryRequest
{
    string Name { get; }
    string? Description { get; }
    string? Color { get; }
    bool IsActive { get; }
}

public class CreateCategoryRequest : ICategoryRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateCategoryRequest : ICategoryRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CategoryQueryFilter : PagedQuery
{
    public CategoryQueryFilter()
    {
        SortBy = "name";
    }

    public string? Name { get; set; }
    public bool? IsActive { get; set; }
}
