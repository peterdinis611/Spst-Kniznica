using CategoryService.DTOs;
using CategoryService.Exceptions;
using CategoryService.Interfaces;
using CategoryService.Models;
using FluentValidation;
using SpstKniznica.Common.Pagination;
using SpstKniznica.Common.Text;

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
        return result.Map(Map);
    }

    public async Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await GetRequiredAsync(id, tracked: false, cancellationToken);
        return Map(category);
    }

    public async Task<CategoryDto> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureValid(await createValidator.ValidateAsync(request, cancellationToken));

        var name = StringNormalize.Required(request.Name);
        await EnsureUniqueNameAsync(name, null, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = StringNormalize.Optional(request.Description),
            Color = StringNormalize.Optional(request.Color),
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
        EnsureValid(await updateValidator.ValidateAsync(context, cancellationToken));

        var category = await GetRequiredAsync(id, tracked: true, cancellationToken);
        var name = StringNormalize.Required(request.Name);
        await EnsureUniqueNameAsync(name, id, cancellationToken);

        category.Name = name;
        category.Description = StringNormalize.Optional(request.Description);
        category.Color = StringNormalize.Optional(request.Color);
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTimeOffset.UtcNow;

        unitOfWork.Categories.Update(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Updated category {CategoryId} named '{Name}'", category.Id, category.Name);
        return Map(category);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await GetRequiredAsync(id, tracked: true, cancellationToken);
        unitOfWork.Categories.Remove(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Deleted category {CategoryId} named '{Name}'", id, category.Name);
    }

    private async Task<Category> GetRequiredAsync(Guid id, bool tracked, CancellationToken cancellationToken)
    {
        var category = tracked
            ? await unitOfWork.Categories.GetTrackedByIdAsync(id, cancellationToken)
            : await unitOfWork.Categories.GetByIdAsync(id, cancellationToken);

        if (category is null)
        {
            logger.LogWarning("Category {CategoryId} was not found", id);
            throw new NotFoundException($"Category '{id}' was not found.");
        }

        return category;
    }

    private async Task EnsureUniqueNameAsync(string name, Guid? excludeId, CancellationToken cancellationToken)
    {
        if (await unitOfWork.Categories.NameExistsAsync(name, excludeId, cancellationToken))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Name"] = ["A category with this name already exists."]
            });
        }
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

    private static void EnsureValid(FluentValidation.Results.ValidationResult validation)
    {
        if (!validation.IsValid)
        {
            throw new AppValidationException(validation.ToDictionary());
        }
    }
}
