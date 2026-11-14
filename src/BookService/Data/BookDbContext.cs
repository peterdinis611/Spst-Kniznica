using BookService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookService.Data;

public class BookDbContext(DbContextOptions<BookDbContext> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();
    public DbSet<BookCopy> BookCopies => Set<BookCopy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>(entity =>
        {
            entity.HasKey(b => b.Id);

            entity.Property(b => b.Title).HasMaxLength(300).IsRequired();
            entity.Property(b => b.Subtitle).HasMaxLength(300);
            entity.Property(b => b.Author).HasMaxLength(200).IsRequired();
            entity.Property(b => b.Publisher).HasMaxLength(200);
            entity.Property(b => b.Isbn).HasMaxLength(32);
            entity.Property(b => b.Language).HasMaxLength(50);
            entity.Property(b => b.CategoryName).HasMaxLength(100);
            entity.Property(b => b.Description).HasMaxLength(4000);
            entity.Property(b => b.CoverUrl).HasMaxLength(500);
            entity.Property(b => b.ShelfLocation).HasMaxLength(50);
            entity.Property(b => b.Format).HasConversion<string>().HasMaxLength(20);

            entity.HasIndex(b => b.Isbn).IsUnique();
            entity.HasIndex(b => b.AuthorId);
            entity.HasIndex(b => b.Author);
            entity.HasIndex(b => b.CategoryId);
            entity.HasIndex(b => b.CategoryName);
            entity.HasIndex(b => b.ShelfLocation);

            entity.HasMany(b => b.Copies)
                .WithOne(c => c.Book)
                .HasForeignKey(c => c.BookId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BookCopy>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.InventoryNumber).HasMaxLength(64).IsRequired();
            entity.Property(c => c.Barcode).HasMaxLength(64);
            entity.Property(c => c.ShelfLocation).HasMaxLength(50);
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);

            entity.HasIndex(c => c.InventoryNumber).IsUnique();
            entity.HasIndex(c => c.Barcode).IsUnique();
            entity.HasIndex(c => c.BookId);
        });
    }
}
