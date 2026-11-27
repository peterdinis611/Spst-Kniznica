using BookingService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Data;

namespace BookingService.Data;

public class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<WaitlistEntry> Waitlist => Set<WaitlistEntry>();
    public DbSet<FavoriteBook> Favorites => Set<FavoriteBook>();
    public DbSet<LoanPolicyStore> LoanPolicyStore => Set<LoanPolicyStore>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyLowercaseGuidText();
        modelBuilder.ApplyForNpgsql(this);

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
            // One open loan/reservation per physical copy (SQLite allows many NULLs).
            entity.HasIndex(b => b.BookCopyId)
                .HasDatabaseName("IX_Bookings_BookCopyId_Active")
                .IsUnique()
                .HasFilter(
                    "\"BookCopyId\" IS NOT NULL AND \"Status\" IN ('Reserved', 'Active', 'Overdue')");
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

        modelBuilder.Entity<LoanPolicyStore>(entity =>
        {
            // Singleton row (Id = 1) — never autoincrement.
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.EventType).HasMaxLength(128).IsRequired();
            entity.Property(o => o.Payload).IsRequired();
            entity.Property(o => o.LastError).HasMaxLength(1000);
            entity.HasIndex(o => o.ProcessedAt);
            entity.HasIndex(o => o.CreatedAt);
        });
    }
}
