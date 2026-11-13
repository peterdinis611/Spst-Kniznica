using BookingService.Clients;
using BookingService.DTOs;
using BookingService.Exceptions;
using BookingService.Interfaces;
using BookingService.Models;
using BookingService.Services;
using BookingService.Tests.Infrastructure;
using BookingService.Validators;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace BookingService.Tests.Services;

public class BookingAppServiceTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IBookingRepository _bookings = Substitute.For<IBookingRepository>();
    private readonly IBookCatalogLookup _bookCatalog = Substitute.For<IBookCatalogLookup>();
    private readonly RecordingEventPublisher _events = new();
    private readonly BookingAppService _sut;

    public BookingAppServiceTests()
    {
        _unitOfWork.Bookings.Returns(_bookings);
        var transaction = Substitute.For<IDbContextTransaction>();
        _unitOfWork.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(transaction);
        _bookCatalog.GetBookAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new BookAvailabilitySnapshot(3, 2));
        _bookings.CountActiveBookingsForBookAsync(
                Arg.Any<Guid>(),
                Arg.Any<Guid?>(),
                Arg.Any<CancellationToken>())
            .Returns(0);
        _bookings.HasActiveBookingForBorrowerOnBookAsync(
                Arg.Any<Guid>(),
                Arg.Any<string>(),
                Arg.Any<Guid?>(),
                Arg.Any<CancellationToken>())
            .Returns(false);

        _sut = new BookingAppService(
            _unitOfWork,
            _bookCatalog,
            new NullAppCache(),
            _events,
            new CreateBookingRequestValidator(),
            new UpdateBookingRequestValidator(),
            NullLogger<BookingAppService>.Instance);
    }

    [Fact]
    public async Task CreateAsync_normalizes_email_and_publishes_event()
    {
        Booking? saved = null;
        _bookings.AddAsync(Arg.Do<Booking>(b => saved = b), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var result = await _sut.CreateAsync(new CreateBookingRequest
        {
            BookId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            BorrowerName = "  Eva Nováková  ",
            BorrowerEmail = "  Eva@SPST.sk  ",
            Status = BookingStatus.Reserved,
            DueDate = DateTimeOffset.Parse("2026-12-01T15:00:00Z"),
            Notes = "  "
        });

        saved.Should().NotBeNull();
        saved!.BorrowerName.Should().Be("Eva Nováková");
        saved.BorrowerEmail.Should().Be("eva@spst.sk");
        saved.Notes.Should().BeNull();
        saved.BorrowedAt.Should().BeNull();
        saved.ReturnedAt.Should().BeNull();
        result.BorrowerEmail.Should().Be("eva@spst.sk");

        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        _events.Events.Should().ContainSingle(e => e is BookingCreatedEvent);
    }

    [Fact]
    public async Task CreateAsync_sets_borrowed_at_for_active_status()
    {
        Booking? saved = null;
        _bookings.AddAsync(Arg.Do<Booking>(b => saved = b), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        await _sut.CreateAsync(new CreateBookingRequest
        {
            BookId = Guid.NewGuid(),
            BorrowerName = "Peter",
            BorrowerEmail = "peter@spst.sk",
            Status = BookingStatus.Active,
            DueDate = DateTimeOffset.UtcNow.AddDays(7)
        });

        saved!.BorrowedAt.Should().NotBeNull();
        saved.ReturnedAt.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_rejects_when_all_copies_are_taken()
    {
        var bookId = Guid.NewGuid();
        _bookings.CountActiveBookingsForBookAsync(bookId, null, Arg.Any<CancellationToken>())
            .Returns(3);
        _bookCatalog.GetBookAsync(bookId, Arg.Any<CancellationToken>())
            .Returns(new BookAvailabilitySnapshot(3, 0));

        var act = async () => await _sut.CreateAsync(new CreateBookingRequest
        {
            BookId = bookId,
            BorrowerName = "Eva",
            BorrowerEmail = "eva@spst.sk",
            DueDate = DateTimeOffset.UtcNow.AddDays(7)
        });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("BookId"));
    }

    [Fact]
    public async Task CreateAsync_rejects_duplicate_open_booking_for_same_borrower()
    {
        var bookId = Guid.NewGuid();
        _bookings.HasActiveBookingForBorrowerOnBookAsync(
                bookId,
                "eva@spst.sk",
                null,
                Arg.Any<CancellationToken>())
            .Returns(true);

        var act = async () => await _sut.CreateAsync(new CreateBookingRequest
        {
            BookId = bookId,
            BorrowerName = "Eva",
            BorrowerEmail = "eva@spst.sk",
            DueDate = DateTimeOffset.UtcNow.AddDays(7)
        });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("BookId"));
    }

    [Fact]
    public async Task CreateAsync_rejects_busy_book_copy()
    {
        var copyId = Guid.NewGuid();
        _bookings.HasActiveBookingForCopyAsync(copyId, null, Arg.Any<CancellationToken>())
            .Returns(true);

        var act = async () => await _sut.CreateAsync(new CreateBookingRequest
        {
            BookId = Guid.NewGuid(),
            BookCopyId = copyId,
            BorrowerName = "Eva",
            BorrowerEmail = "eva@spst.sk",
            DueDate = DateTimeOffset.UtcNow.AddDays(7)
        });

        await act.Should().ThrowAsync<AppValidationException>()
            .Where(ex => ex.Errors.ContainsKey("BookCopyId"));
    }

    [Fact]
    public async Task UpdateAsync_sets_returned_at_when_closing_loan()
    {
        var id = Guid.NewGuid();
        var booking = new Booking
        {
            Id = id,
            BookId = Guid.NewGuid(),
            BorrowerName = "Eva",
            BorrowerEmail = "eva@spst.sk",
            Status = BookingStatus.Active,
            ReservedAt = DateTimeOffset.UtcNow.AddDays(-2),
            BorrowedAt = DateTimeOffset.UtcNow.AddDays(-2),
            DueDate = DateTimeOffset.UtcNow.AddDays(5),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-2)
        };

        _bookings.GetTrackedByIdAsync(id, Arg.Any<CancellationToken>()).Returns(booking);

        var result = await _sut.UpdateAsync(id, new UpdateBookingRequest
        {
            BookId = booking.BookId,
            BorrowerName = booking.BorrowerName,
            BorrowerEmail = booking.BorrowerEmail,
            Status = BookingStatus.Returned,
            DueDate = booking.DueDate
        });

        booking.Status.Should().Be(BookingStatus.Returned);
        booking.ReturnedAt.Should().NotBeNull();
        booking.BorrowedAt.Should().NotBeNull();
        result.Status.Should().Be(BookingStatus.Returned);
        _events.Events.Should().ContainSingle(e => e is BookingUpdatedEvent);
    }

    [Fact]
    public async Task UpdateAsync_clears_returned_at_when_reopening()
    {
        var id = Guid.NewGuid();
        var booking = new Booking
        {
            Id = id,
            BookId = Guid.NewGuid(),
            BorrowerName = "Eva",
            BorrowerEmail = "eva@spst.sk",
            Status = BookingStatus.Returned,
            ReservedAt = DateTimeOffset.UtcNow.AddDays(-10),
            BorrowedAt = DateTimeOffset.UtcNow.AddDays(-9),
            ReturnedAt = DateTimeOffset.UtcNow.AddDays(-1),
            DueDate = DateTimeOffset.UtcNow.AddDays(-1),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-10),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };

        _bookings.GetTrackedByIdAsync(id, Arg.Any<CancellationToken>()).Returns(booking);

        await _sut.UpdateAsync(id, new UpdateBookingRequest
        {
            BookId = booking.BookId,
            BorrowerName = booking.BorrowerName,
            BorrowerEmail = booking.BorrowerEmail,
            Status = BookingStatus.Active,
            DueDate = DateTimeOffset.UtcNow.AddDays(7)
        });

        booking.Status.Should().Be(BookingStatus.Active);
        booking.ReturnedAt.Should().BeNull();
        booking.BorrowedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateAsync_throws_not_found()
    {
        var id = Guid.NewGuid();
        _bookings.GetTrackedByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Booking?)null);

        var act = async () => await _sut.UpdateAsync(id, new UpdateBookingRequest
        {
            BookId = Guid.NewGuid(),
            BorrowerName = "Eva",
            BorrowerEmail = "eva@spst.sk",
            Status = BookingStatus.Reserved,
            DueDate = DateTimeOffset.UtcNow.AddDays(7)
        });

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_publishes_deleted_event()
    {
        var id = Guid.NewGuid();
        var bookId = Guid.NewGuid();
        _bookings.GetTrackedByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Booking
        {
            Id = id,
            BookId = bookId,
            BorrowerName = "Eva",
            BorrowerEmail = "eva@spst.sk",
            DueDate = DateTimeOffset.UtcNow,
            ReservedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });

        await _sut.DeleteAsync(id);

        _bookings.Received(1).Remove(Arg.Any<Booking>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        _events.Events.Should().ContainSingle(e => e is BookingDeletedEvent);
    }
}
