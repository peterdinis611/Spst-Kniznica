using BookingService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Data;

public class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<WaitlistEntry> Waitlist => Set<WaitlistEntry>();
    public DbSet<FavoriteBook> Favorites => Set<FavoriteBook>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.BorrowerName).HasMaxLength(200).IsRequired();
            entity.Property(b => b.BorrowerEmail).HasMaxLength(256).IsRequired();
            entity.Property(b => b.Notes).HasMaxLength(1000);
            entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(b => b.RenewalCount).HasDefaultValue(0);
            entity.HasIndex(b => b.BookId);
            entity.HasIndex(b => b.BookCopyId);
            entity.HasIndex(b => b.BorrowerEmail);
            entity.HasIndex(b => b.Status);
            entity.HasIndex(b => b.DueDate);
        });

        modelBuilder.Entity<WaitlistEntry>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.Property(w => w.BorrowerName).HasMaxLength(200).IsRequired();
            entity.Property(w => w.BorrowerEmail).HasMaxLength(256).IsRequired();
            entity.Property(w => w.Notes).HasMaxLength(1000);
            entity.HasIndex(w => w.BookId);
            entity.HasIndex(w => w.BorrowerEmail);
            entity.HasIndex(w => new { w.BookId, w.BorrowerEmail }).IsUnique();
        });

        modelBuilder.Entity<FavoriteBook>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.OwnerEmail).HasMaxLength(256).IsRequired();
            entity.Property(f => f.ListName).HasMaxLength(120).IsRequired();
            entity.HasIndex(f => f.OwnerEmail);
            entity.HasIndex(f => new { f.OwnerEmail, f.BookId, f.ListName }).IsUnique();
        });
    }
}
