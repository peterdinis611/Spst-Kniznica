using AuthorService.DTOs;
using AuthorService.Exceptions;
using AuthorService.Interfaces;
using AuthorService.Models;
using AuthorService.Services;
using AuthorService.Validators;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace AuthorService.Tests.Services;

public class AuthorAppServiceTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IAuthorRepository _authors = Substitute.For<IAuthorRepository>();
    private readonly IRelationBookCountLookup _relationBookCount =
        Substitute.For<IRelationBookCountLookup>();
    private readonly RecordingEventPublisher _events = new();
    private readonly AuthorAppService _sut;

    public AuthorAppServiceTests()
    {
        _unitOfWork.Authors.Returns(_authors);
        _sut = new AuthorAppService(
            _unitOfWork,
            new NullAppCache(),
            _events,
            _relationBookCount,
            new CreateAuthorRequestValidator(),
            new UpdateAuthorRequestValidator(),
            NullLogger<AuthorAppService>.Instance);
    }

    [Fact]
    public async Task CreateAsync_persists_trimmed_author_and_publishes_event()
    {
        Author? saved = null;
        _authors.NameExistsAsync(Arg.Any<string>(), null, Arg.Any<CancellationToken>()).Returns(false);
        _authors.AddAsync(Arg.Do<Author>(a => saved = a), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var dto = await _sut.CreateAsync(new CreateAuthorRequest
        {
            Name = "  Ján Kováč  ",
            Biography = "  ",
            Nationality = " SK ",
            BirthYear = 1970,
            WikidataId = " Q42 ",
            ViafId = " 102333412 ",
            ProfileUrl = " https://www.wikidata.org/wiki/Q42 ",
        });

        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Ján Kováč");
        saved.Biography.Should().BeNull();
        saved.Nationality.Should().Be("SK");
        saved.WikidataId.Should().Be("Q42");
        saved.ViafId.Should().Be("102333412");
        saved.ProfileUrl.Should().Be("https://www.wikidata.org/wiki/Q42");
        dto.Name.Should().Be("Ján Kováč");
        dto.WikidataId.Should().Be("Q42");
        _events.Events.Should().ContainSingle(e => e is AuthorCreatedEvent);
    }

    [Fact]
    public async Task CreateAsync_rejects_duplicate_name()
    {
        _authors.NameExistsAsync("Ján Kováč", null, Arg.Any<CancellationToken>()).Returns(true);

        var act = async () => await _sut.CreateAsync(new CreateAuthorRequest
        {
            Name = "Ján Kováč"
        });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("Name"));
    }

    [Fact]
    public async Task GetByIdAsync_throws_when_missing()
    {
        var id = Guid.NewGuid();
        _authors.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Author?)null);

        var act = async () => await _sut.GetByIdAsync(id);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetByIdAsync_attaches_fresh_book_count()
    {
        var id = Guid.Parse("b2222222-2222-4222-8222-222222222006");
        _authors.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Author
        {
            Id = id,
            Name = "Morgan Housel",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        _relationBookCount.GetAuthorBookCountAsync(id, Arg.Any<CancellationToken>())
            .Returns(7);

        var dto = await _sut.GetByIdAsync(id);

        dto.Id.Should().Be(id);
        dto.Name.Should().Be("Morgan Housel");
        dto.BookCount.Should().Be(7);
    }

    [Fact]
    public async Task GetByIdAsync_keeps_zero_when_relation_lookup_returns_null()
    {
        var id = Guid.NewGuid();
        _authors.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Author
        {
            Id = id,
            Name = "Neznámy",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        _relationBookCount.GetAuthorBookCountAsync(id, Arg.Any<CancellationToken>())
            .Returns((int?)null);

        var dto = await _sut.GetByIdAsync(id);

        dto.BookCount.Should().Be(0);
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
