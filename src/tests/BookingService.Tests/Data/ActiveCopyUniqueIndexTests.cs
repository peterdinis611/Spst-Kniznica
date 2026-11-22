using BookingService.Data;
using BookingService.Models;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Tests.Data;

public class ActiveCopyUniqueIndexTests
{
    [Fact]
    public async Task Second_active_booking_for_same_copy_is_rejected()
    {
        var path = Path.Combine(Path.GetTempPath(), $"spst-booking-{Guid.NewGuid():N}.db");
        try
        {
            var options = new DbContextOptionsBuilder<BookingDbContext>()
                .UseSqlite($"Data Source={path}")
                .Options;

            await using (var db = new BookingDbContext(options))
            {
                await db.Database.EnsureCreatedAsync();
                await LibraryOpsSchema.EnsureAsync(db);
            }

            var copyId = Guid.NewGuid();
            var bookId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;

            await using (var db = new BookingDbContext(options))
            {
                db.Bookings.Add(MakeBooking(bookId, copyId, now, "a@school.sk"));
                await db.SaveChangesAsync();
            }

            await using (var db = new BookingDbContext(options))
            {
                db.Bookings.Add(MakeBooking(bookId, copyId, now, "b@school.sk"));
                var act = async () => await db.SaveChangesAsync();
                var ex = await act.Should().ThrowAsync<DbUpdateException>();
                ex.Which.InnerException.Should().BeOfType<SqliteException>();
            }
        }
        finally
        {
            foreach (var suffix in new[] { "", "-wal", "-shm" })
            {
                var file = path + suffix;
                if (File.Exists(file))
                {
                    File.Delete(file);
                }
            }
        }
    }

    private static Booking MakeBooking(Guid bookId, Guid copyId, DateTimeOffset now, string email) =>
        new()
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            BookCopyId = copyId,
            BorrowerName = "Žiak",
            BorrowerEmail = email,
            Status = BookingStatus.Reserved,
            ReservedAt = now,
            DueDate = now.AddDays(14),
            CreatedAt = now,
            UpdatedAt = now,
        };
}
