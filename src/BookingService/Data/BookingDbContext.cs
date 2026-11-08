using BookingService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Data;

public class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.BorrowerName).HasMaxLength(200).IsRequired();
            entity.Property(b => b.BorrowerEmail).HasMaxLength(256).IsRequired();
            entity.Property(b => b.Notes).HasMaxLength(1000);
            entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(b => b.BookId);
            entity.HasIndex(b => b.BookCopyId);
            entity.HasIndex(b => b.BorrowerEmail);
            entity.HasIndex(b => b.Status);
            entity.HasIndex(b => b.DueDate);
        });
    }
}
