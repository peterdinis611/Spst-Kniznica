using BookingService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Seed;

namespace BookingService.Data;

public static class BookingSeed
{
    public static async Task EnsureSeededAsync(
        BookingDbContext db,
        CancellationToken cancellationToken = default)
    {
        if (await db.Bookings.AnyAsync(cancellationToken))
        {
            return;
        }

        Console.WriteLine("[BookingSeed] Seeding mock bookings…");
        var now = DateTimeOffset.UtcNow;

        db.Bookings.AddRange(
            new Booking
            {
                Id = LibrarySeedIds.BookingPsychMoneyActive,
                BookId = LibrarySeedIds.BookPsychMoney,
                BorrowerName = "Anna Nováková",
                BorrowerEmail = "anna.novakova@spst.sk",
                Status = BookingStatus.Active,
                ReservedAt = now.AddDays(-10),
                BorrowedAt = now.AddDays(-7),
                DueDate = now.AddDays(7),
                Notes = "Študentská výpožička",
                CreatedAt = now.AddDays(-10),
                UpdatedAt = now.AddDays(-7),
            },
            new Booking
            {
                Id = LibrarySeedIds.BookingAtomicHabitsReserved,
                BookId = LibrarySeedIds.BookAtomicHabits,
                BorrowerName = "Peter Horváth",
                BorrowerEmail = "peter.horvath@spst.sk",
                Status = BookingStatus.Reserved,
                ReservedAt = now.AddDays(-1),
                DueDate = now.AddDays(14),
                Notes = "Rezervácia do konca týždňa",
                CreatedAt = now.AddDays(-1),
                UpdatedAt = now.AddDays(-1),
            },
            new Booking
            {
                Id = LibrarySeedIds.BookingLeanStartupReturned,
                BookId = LibrarySeedIds.BookLeanStartup,
                BorrowerName = "Mária Kováčová",
                BorrowerEmail = "maria.kovacova@spst.sk",
                Status = BookingStatus.Returned,
                ReservedAt = now.AddDays(-30),
                BorrowedAt = now.AddDays(-28),
                DueDate = now.AddDays(-14),
                ReturnedAt = now.AddDays(-15),
                Notes = "Vrátené včas",
                CreatedAt = now.AddDays(-30),
                UpdatedAt = now.AddDays(-15),
            },
            new Booking
            {
                Id = LibrarySeedIds.BookingDorianOverdue,
                BookId = LibrarySeedIds.BookDorian,
                BorrowerName = "Ján Tóth",
                BorrowerEmail = "jan.toth@spst.sk",
                Status = BookingStatus.Overdue,
                ReservedAt = now.AddDays(-40),
                BorrowedAt = now.AddDays(-35),
                DueDate = now.AddDays(-5),
                Notes = "Po splatnosti – upomienka odoslaná",
                CreatedAt = now.AddDays(-40),
                UpdatedAt = now.AddDays(-5),
            });

        await db.SaveChangesAsync(cancellationToken);
        Console.WriteLine("[BookingSeed] Seeded {0} bookings.", await db.Bookings.CountAsync(cancellationToken));
    }
}
