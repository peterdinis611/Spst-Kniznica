using BookingService.DTOs;
using BookingService.Exceptions;
using BookingService.Interfaces;
using BookingService.Models;
using BookingService.Options;
using FluentValidation;
using Microsoft.Extensions.Options;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;
using SpstKniznica.Common.Pagination;
using SpstKniznica.Common.Text;

namespace BookingService.Services;

public class BookingAppService(
    IUnitOfWork unitOfWork,
    IBookCatalogLookup bookCatalog,
    IAppCache cache,
    IIntegrationEventPublisher eventPublisher,
    IValidator<CreateBookingRequest> createValidator,
    IValidator<UpdateBookingRequest> updateValidator,
    IOptions<LoanPolicyOptions> policyOptions,
    LoanLifecycleService lifecycle,
    SchoolCalendarService schoolCalendar,
    ILogger<BookingAppService> logger) : IBookingService
{
    public async Task<PagedResult<BookingDto>> SearchAsync(
        BookingQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug(
            "Searching bookings. Page={Page}, PageSize={PageSize}, Search={Search}, Status={Status}, BookId={BookId}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.Status,
            filter.BookId);

        var result = await unitOfWork.Bookings.FindAsync(filter, cancellationToken);
        return result.Map(Map);
    }

    public async Task<BookingDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await cache.GetOrSetAsync(
            CacheKeys.Booking(id),
            async ct =>
            {
                var booking = await GetRequiredAsync(id, tracked: false, ct);
                return Map(booking);
            },
            TimeSpan.FromMinutes(10),
            cancellationToken);
    }

    public async Task<BookingDto> CreateAsync(
        CreateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureValid(await createValidator.ValidateAsync(request, cancellationToken));
        EnsureNotFrozen();

        var borrowerEmail = NormalizeEmail(request.BorrowerEmail);
        await EnsureReaderUnderLoanLimitAsync(borrowerEmail, excludeBookingId: null, cancellationToken);
        request.DueDate = await schoolCalendar.AdjustDueDateAsync(request.DueDate, cancellationToken);

        await using var transaction =
            await unitOfWork.BeginTransactionAsync(cancellationToken);

        await EnsureCopyAvailableAsync(request.BookCopyId, null, cancellationToken);
        await EnsureBookCanAcceptReservationAsync(
            request.BookId,
            borrowerEmail,
            excludeBookingId: null,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var status = request.Status;
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookId = request.BookId,
            BookCopyId = request.BookCopyId,
            BorrowerName = StringNormalize.Required(request.BorrowerName),
            BorrowerEmail = borrowerEmail,
            Status = status,
            ReservedAt = now,
            BorrowedAt = status is BookingStatus.Active or BookingStatus.Overdue
                ? now
                : null,
            DueDate = request.DueDate,
            ReturnedAt = status == BookingStatus.Returned ? now : null,
            Notes = StringNormalize.Optional(request.Notes),
            CreatedAt = now,
            UpdatedAt = now
        };

        await unitOfWork.Bookings.AddAsync(booking, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        await eventPublisher.PublishAsync(
            new BookingCreatedEvent(
                booking.Id,
                booking.BookId,
                booking.BookCopyId,
                booking.BorrowerName,
                booking.BorrowerEmail,
                booking.Status.ToString(),
                booking.DueDate),
            cancellationToken);

        var dto = Map(booking);
        await cache.SetAsync(CacheKeys.Booking(booking.Id), dto, TimeSpan.FromMinutes(10), cancellationToken);

        logger.LogInformation(
            "Created booking {BookingId} for book {BookId} ({Status})",
            booking.Id,
            booking.BookId,
            booking.Status);
        return dto;
    }

    public async Task<BookingDto> UpdateAsync(
        Guid id,
        UpdateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        var context = new ValidationContext<UpdateBookingRequest>(request);
        context.RootContextData["BookingId"] = id;
        EnsureValid(await updateValidator.ValidateAsync(context, cancellationToken));

        var booking = await GetRequiredAsync(id, tracked: true, cancellationToken);
        await EnsureCopyAvailableAsync(request.BookCopyId, id, cancellationToken);

        var nextStatus = request.Status;
        if (nextStatus is BookingStatus.Reserved or BookingStatus.Active or BookingStatus.Overdue)
        {
            await EnsureBookCanAcceptReservationAsync(
                request.BookId,
                NormalizeEmail(request.BorrowerEmail),
                excludeBookingId: id,
                cancellationToken);
        }

        var previousStatus = booking.Status;
        var now = DateTimeOffset.UtcNow;

        booking.BookId = request.BookId;
        booking.BookCopyId = request.BookCopyId;
        booking.BorrowerName = StringNormalize.Required(request.BorrowerName);
        booking.BorrowerEmail = NormalizeEmail(request.BorrowerEmail);
        booking.Status = request.Status;
        booking.DueDate = await schoolCalendar.AdjustDueDateAsync(request.DueDate, cancellationToken);
        booking.Notes = StringNormalize.Optional(request.Notes);
        booking.UpdatedAt = now;

        ApplyStatusTimestamps(booking, previousStatus, request.Status, now);

        unitOfWork.Bookings.Update(booking);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(
            new BookingUpdatedEvent(
                booking.Id,
                booking.BookId,
                booking.BookCopyId,
                booking.BorrowerName,
                booking.BorrowerEmail,
                booking.Status.ToString(),
                booking.DueDate),
            cancellationToken);

        if ((previousStatus is BookingStatus.Reserved or BookingStatus.Active or BookingStatus.Overdue)
            && (nextStatus is BookingStatus.Returned or BookingStatus.Cancelled))
        {
            await lifecycle.TryPromoteWaitlistAsync(booking.BookId, cancellationToken);
        }

        var dto = Map(booking);
        await cache.SetAsync(CacheKeys.Booking(booking.Id), dto, TimeSpan.FromMinutes(10), cancellationToken);

        logger.LogInformation(
            "Updated booking {BookingId} for book {BookId} ({Status})",
            booking.Id,
            booking.BookId,
            booking.Status);
        return dto;
    }

    public async Task<BookingDto> CancelAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var booking = await GetRequiredAsync(id, tracked: true, cancellationToken);
        if (booking.Status != BookingStatus.Reserved)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Status"] = ["Zrušiť môžeš len rezerváciu (ešte nevydanú)."]
            });
        }

        return await UpdateAsync(
            id,
            new UpdateBookingRequest
            {
                BookId = booking.BookId,
                BookCopyId = booking.BookCopyId,
                BorrowerName = booking.BorrowerName,
                BorrowerEmail = booking.BorrowerEmail,
                Status = BookingStatus.Cancelled,
                DueDate = booking.DueDate,
                Notes = booking.Notes,
            },
            cancellationToken);
    }

    public async Task<BookingDto> RenewAsync(
        Guid id,
        int? extraDays = null,
        CancellationToken cancellationToken = default)
    {
        var policy = policyOptions.Value;
        var booking = await GetRequiredAsync(id, tracked: true, cancellationToken);

        if (booking.Status is not (BookingStatus.Active or BookingStatus.Overdue))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Status"] = ["Predĺžiť môžeš len aktívnu alebo oneskorenú výpožičku."]
            });
        }

        if (booking.RenewalCount >= policy.MaxRenewals)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["RenewalCount"] = [$"Dosiahnutý limit predĺžení ({policy.MaxRenewals})."]
            });
        }

        var days = extraDays is > 0 ? extraDays.Value : policy.RenewExtraDays;
        var nextDue = await schoolCalendar.AdjustDueDateAsync(booking.DueDate.AddDays(days), cancellationToken);
        if (nextDue <= booking.DueDate)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["DueDate"] = ["Termín sa nedá predĺžiť (koniec školského roka / freeze)."]
            });
        }

        booking.DueDate = nextDue;
        booking.RenewalCount += 1;
        booking.Status = BookingStatus.Active;
        booking.UpdatedAt = DateTimeOffset.UtcNow;
        unitOfWork.Bookings.Update(booking);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(
            new BookingUpdatedEvent(
                booking.Id,
                booking.BookId,
                booking.BookCopyId,
                booking.BorrowerName,
                booking.BorrowerEmail,
                booking.Status.ToString(),
                booking.DueDate),
            cancellationToken);

        var dto = Map(booking);
        await cache.SetAsync(CacheKeys.Booking(booking.Id), dto, TimeSpan.FromMinutes(10), cancellationToken);
        logger.LogInformation(
            "Renewed booking {BookingId} → due {DueDate:o} (#{RenewalCount})",
            booking.Id,
            booking.DueDate,
            booking.RenewalCount);
        return dto;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var booking = await GetRequiredAsync(id, tracked: true, cancellationToken);
        var bookId = booking.BookId;
        unitOfWork.Bookings.Remove(booking);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(new BookingDeletedEvent(id, bookId), cancellationToken);
        await cache.RemoveAsync(CacheKeys.Booking(id), cancellationToken);
        await lifecycle.TryPromoteWaitlistAsync(bookId, cancellationToken);
        logger.LogInformation("Deleted booking {BookingId} for book {BookId}", id, bookId);
    }

    private async Task<Booking> GetRequiredAsync(Guid id, bool tracked, CancellationToken cancellationToken)
    {
        var booking = tracked
            ? await unitOfWork.Bookings.GetTrackedByIdAsync(id, cancellationToken)
            : await unitOfWork.Bookings.GetByIdAsync(id, cancellationToken);

        if (booking is null)
        {
            logger.LogWarning("Booking {BookingId} was not found", id);
            throw new NotFoundException($"Booking '{id}' was not found.");
        }

        return booking;
    }

    private async Task EnsureCopyAvailableAsync(
        Guid? bookCopyId,
        Guid? excludeBookingId,
        CancellationToken cancellationToken)
    {
        if (!bookCopyId.HasValue)
        {
            return;
        }

        if (await unitOfWork.Bookings.HasActiveBookingForCopyAsync(bookCopyId.Value, excludeBookingId, cancellationToken))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["BookCopyId"] = ["This book copy already has an active reservation or loan."]
            });
        }
    }

    private async Task EnsureBookCanAcceptReservationAsync(
        Guid bookId,
        string borrowerEmail,
        Guid? excludeBookingId,
        CancellationToken cancellationToken)
    {
        if (await unitOfWork.Bookings.HasActiveBookingForBorrowerOnBookAsync(
                bookId,
                borrowerEmail,
                excludeBookingId,
                cancellationToken))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["BookId"] =
                [
                    "Na túto knihu už máš otvorenú rezerváciu alebo výpožičku."
                ]
            });
        }

        var snapshot = await bookCatalog.GetBookAsync(bookId, cancellationToken);
        var capacity = snapshot?.TotalCopies ?? 1;
        var activeCount = await unitOfWork.Bookings.CountActiveBookingsForBookAsync(
            bookId,
            excludeBookingId,
            cancellationToken);

        if (activeCount >= capacity)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["BookId"] =
                [
                    "Všetky exempláre tohto titulu sú už rezervované alebo vypožičané. Môžeš sa zaradiť do čakacieho zoznamu."
                ]
            });
        }
    }

    private async Task EnsureReaderUnderLoanLimitAsync(
        string borrowerEmail,
        Guid? excludeBookingId,
        CancellationToken cancellationToken)
    {
        var max = policyOptions.Value.MaxActiveLoansPerReader;
        if (max <= 0) return;

        var open = await unitOfWork.Bookings.CountOpenBookingsForBorrowerAsync(
            borrowerEmail,
            excludeBookingId,
            cancellationToken);
        if (open >= max)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["BorrowerEmail"] =
                [
                    $"Dosiahnutý limit otvorených výpožičiek ({max}). Vráť niektorú knihu alebo zruš rezerváciu."
                ]
            });
        }
    }

    private void EnsureNotFrozen()
    {
        if (policyOptions.Value.FreezeNewLoans)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Status"] = ["Nové rezervácie sú dočasne pozastavené (koniec školského obdobia)."]
            });
        }
    }

    private static void ApplyStatusTimestamps(
        Booking booking,
        BookingStatus previous,
        BookingStatus next,
        DateTimeOffset now)
    {
        if ((next is BookingStatus.Active or BookingStatus.Overdue) && booking.BorrowedAt is null)
        {
            booking.BorrowedAt = now;
        }

        if (next == BookingStatus.Returned)
        {
            booking.ReturnedAt ??= now;
        }
        else if (previous == BookingStatus.Returned)
        {
            booking.ReturnedAt = null;
        }
    }

    private static string NormalizeEmail(string email)
        => StringNormalize.Required(email).ToLowerInvariant();

    private static BookingDto Map(Booking booking) => new()
    {
        Id = booking.Id,
        BookId = booking.BookId,
        BookCopyId = booking.BookCopyId,
        BorrowerName = booking.BorrowerName,
        BorrowerEmail = booking.BorrowerEmail,
        Status = booking.Status,
        ReservedAt = booking.ReservedAt,
        BorrowedAt = booking.BorrowedAt,
        DueDate = booking.DueDate,
        ReturnedAt = booking.ReturnedAt,
        Notes = booking.Notes,
        RenewalCount = booking.RenewalCount,
        CreatedAt = booking.CreatedAt,
        UpdatedAt = booking.UpdatedAt
    };

    private static void EnsureValid(FluentValidation.Results.ValidationResult validation)
    {
        if (!validation.IsValid)
        {
            throw new AppValidationException(validation.ToDictionary());
        }
    }
}
