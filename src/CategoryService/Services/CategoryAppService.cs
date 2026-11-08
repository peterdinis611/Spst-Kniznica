using CategoryService.DTOs;
using CategoryService.Exceptions;
using CategoryService.Interfaces;
using CategoryService.Models;
using FluentValidation;

namespace CategoryService.Services;

public class CategoryAppService(
    IUnitOfWork unitOfWork,
    IValidator<CreateCategoryRequest> createValidator,
    IValidator<UpdateCategoryRequest> updateValidator,
    ILogger<CategoryAppService> logger) : ICategoryService
{
    public async Task<PagedResult<CategoryDto>> SearchAsync(
        CategoryQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug(
            "Searching categories. Page={Page}, PageSize={PageSize}, Search={Search}, IsActive={IsActive}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.IsActive);

        var result = await unitOfWork.Categories.FindAsync(filter, cancellationToken);

        return new PagedResult<CategoryDto>
        {
            Items = result.Items.Select(Map).ToList(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        };
    }

    public async Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            logger.LogWarning("Category {CategoryId} was not found", id);
            throw new NotFoundException($"Category '{id}' was not found.");
        }

        return Map(category);
    }

    public async Task<CategoryDto> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        EnsureValid(validation);

        var name = request.Name.Trim();
        if (await unitOfWork.Categories.NameExistsAsync(name, cancellationToken: cancellationToken))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Name"] = ["A category with this name already exists."]
            });
        }

        var now = DateTimeOffset.UtcNow;
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = NormalizeOptional(request.Description),
            Color = NormalizeOptional(request.Color),
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        await unitOfWork.Categories.AddAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Created category {CategoryId} named '{Name}'", category.Id, category.Name);
        return Map(category);
    }

    public async Task<CategoryDto> UpdateAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var context = new ValidationContext<UpdateCategoryRequest>(request);
        context.RootContextData["CategoryId"] = id;
        var validation = await updateValidator.ValidateAsync(context, cancellationToken);
        EnsureValid(validation);

        var category = await unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            logger.LogWarning("Update failed. Category {CategoryId} was not found", id);
            throw new NotFoundException($"Category '{id}' was not found.");
        }

        var name = request.Name.Trim();
        if (await unitOfWork.Categories.NameExistsAsync(name, id, cancellationToken))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Name"] = ["A category with this name already exists."]
            });
        }

        category.Name = name;
        category.Description = NormalizeOptional(request.Description);
        category.Color = NormalizeOptional(request.Color);
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTimeOffset.UtcNow;

        unitOfWork.Categories.Update(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Updated category {CategoryId} named '{Name}'", category.Id, category.Name);
        return Map(category);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            logger.LogWarning("Delete failed. Category {CategoryId} was not found", id);
            throw new NotFoundException($"Category '{id}' was not found.");
        }

        unitOfWork.Categories.Remove(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Deleted category {CategoryId} named '{Name}'", id, category.Name);
    }

    private static CategoryDto Map(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Description = category.Description,
        Color = category.Color,
        IsActive = category.IsActive,
        CreatedAt = category.CreatedAt,
        UpdatedAt = category.UpdatedAt
    };

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void EnsureValid(FluentValidation.Results.ValidationResult validation)
    {
        if (!validation.IsValid)
        {
            throw new AppValidationException(validation.ToDictionary());
        }
    }
}
