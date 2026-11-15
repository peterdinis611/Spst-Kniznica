namespace CategoryService.Interfaces;

public interface IRelationBookCountLookup
{
    Task<int?> GetCategoryBookCountAsync(Guid categoryId, CancellationToken cancellationToken = default);
}
