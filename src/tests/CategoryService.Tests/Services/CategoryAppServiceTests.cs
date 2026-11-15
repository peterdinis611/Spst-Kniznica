using CategoryService.DTOs;
using CategoryService.Exceptions;
using CategoryService.Interfaces;
using CategoryService.Models;
using CategoryService.Services;
using CategoryService.Validators;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace CategoryService.Tests.Services;

public class CategoryAppServiceTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ICategoryRepository _categories = Substitute.For<ICategoryRepository>();
    private readonly IRelationBookCountLookup _relationBookCount =
        Substitute.For<IRelationBookCountLookup>();
    private readonly RecordingEventPublisher _events = new();
    private readonly CategoryAppService _sut;

    public CategoryAppServiceTests()
    {
        _unitOfWork.Categories.Returns(_categories);
        _sut = new CategoryAppService(
            _unitOfWork,
            new NullAppCache(),
            _events,
            _relationBookCount,
            new CreateCategoryRequestValidator(),
            new UpdateCategoryRequestValidator(),
            NullLogger<CategoryAppService>.Instance);
    }

    [Fact]
    public async Task CreateAsync_persists_trimmed_category_and_publishes_event()
    {
        Category? saved = null;
        _categories.NameExistsAsync(Arg.Any<string>(), null, Arg.Any<CancellationToken>()).Returns(false);
        _categories.AddAsync(Arg.Do<Category>(c => saved = c), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var dto = await _sut.CreateAsync(new CreateCategoryRequest
        {
            Name = "  Programovanie  ",
            Description = "  ",
            Color = "#1F4E8C",
            IsActive = true,
        });

        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Programovanie");
        saved.Description.Should().BeNull();
        saved.Color.Should().Be("#1F4E8C");
        dto.Name.Should().Be("Programovanie");
        dto.Color.Should().Be("#1F4E8C");
        _events.Events.Should().ContainSingle(e => e is CategoryCreatedEvent);
    }

    [Fact]
    public async Task CreateAsync_rejects_duplicate_name()
    {
        _categories.NameExistsAsync("Programovanie", null, Arg.Any<CancellationToken>()).Returns(true);

        var act = async () => await _sut.CreateAsync(new CreateCategoryRequest
        {
            Name = "Programovanie",
        });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("Name"));
    }

    [Fact]
    public async Task GetByIdAsync_throws_when_missing()
    {
        var id = Guid.NewGuid();
        _categories.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Category?)null);

        var act = async () => await _sut.GetByIdAsync(id);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetByIdAsync_attaches_fresh_book_count()
    {
        var id = Guid.Parse("a1111111-1111-4111-8111-11111111100a");
        _categories.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Category
        {
            Id = id,
            Name = "Programovanie",
            Color = "#112233",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        _relationBookCount.GetCategoryBookCountAsync(id, Arg.Any<CancellationToken>())
            .Returns(11);

        var dto = await _sut.GetByIdAsync(id);

        dto.Id.Should().Be(id);
        dto.Name.Should().Be("Programovanie");
        dto.BookCount.Should().Be(11);
    }

    private sealed class RecordingEventPublisher : IIntegrationEventPublisher
    {
        public List<object> Events { get; } = [];

        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
            where TEvent : IntegrationEvent
        {
            Events.Add(integrationEvent!);
            return Task.CompletedTask;
        }
    }
}
