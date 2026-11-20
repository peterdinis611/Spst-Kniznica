using System.Security.Claims;
using BookService.Controllers;
using BookService.DTOs;
using BookService.Interfaces;
using BookService.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Integrations;

namespace BookService.Tests.Controllers;

public class BooksControllerGetByIdTests
{
    private readonly IBooksService _books = Substitute.For<IBooksService>();
    private readonly IAuditLogger _audit = Substitute.For<IAuditLogger>();

    private BooksController CreateSut(ClaimsPrincipal user)
    {
        var turnstile = new TurnstileVerifier(
            new HttpClient(),
            Options.Create(new TurnstileOptions { Enabled = false }),
            NullLogger<TurnstileVerifier>.Instance);
        var isbn = new IsbnCatalogLookup(
            new OpenLibraryClient(new HttpClient(), NullLogger<OpenLibraryClient>.Instance),
            new WorldCatClient(
                new HttpClient(),
                Options.Create(new WorldCatOptions { Enabled = false }),
                NullLogger<WorldCatClient>.Instance));

        return new BooksController(
            _books,
            isbn,
            turnstile,
            _audit,
            NullLogger<BooksController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user },
            },
        };
    }

    private static BookDetailDto SampleBook() => new()
    {
        Id = Guid.NewGuid(),
        Title = "Test",
        Author = "Author",
        Copies =
        [
            new BookCopyDto
            {
                Id = Guid.NewGuid(),
                InventoryNumber = "INV-1",
                Barcode = "BC-1",
                Status = BookCopyStatus.Available,
                ShelfLocation = "A1",
            },
        ],
    };

    [Fact]
    public async Task GetById_redacts_inventory_and_barcode_for_anonymous()
    {
        var book = SampleBook();
        _books.GetByIdAsync(book.Id, Arg.Any<CancellationToken>()).Returns(book);
        var sut = CreateSut(new ClaimsPrincipal(new ClaimsIdentity()));

        var result = await sut.GetById(book.Id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<BookDetailDto>().Subject;
        dto.Copies.Should().ContainSingle();
        dto.Copies[0].InventoryNumber.Should().BeEmpty();
        dto.Copies[0].Barcode.Should().BeNull();
        dto.Copies[0].ShelfLocation.Should().Be("A1");
    }

    [Fact]
    public async Task GetById_keeps_inventory_for_staff()
    {
        var book = SampleBook();
        _books.GetByIdAsync(book.Id, Arg.Any<CancellationToken>()).Returns(book);
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Role, AppRoles.Librarian)],
            authenticationType: "test");
        var sut = CreateSut(new ClaimsPrincipal(identity));

        var result = await sut.GetById(book.Id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<BookDetailDto>().Subject;
        dto.Copies[0].InventoryNumber.Should().Be("INV-1");
        dto.Copies[0].Barcode.Should().Be("BC-1");
    }
}
