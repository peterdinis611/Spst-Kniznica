using BookService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookService.Data;

public class BookDbContext(DbContextOptions<BookDbContext> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();

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
            entity.Property(b => b.Category).HasMaxLength(100);
            entity.Property(b => b.Description).HasMaxLength(4000);
            entity.Property(b => b.ShelfLocation).HasMaxLength(50);
            entity.Property(b => b.Format).HasConversion<string>().HasMaxLength(20);

            entity.HasIndex(b => b.Isbn).IsUnique();
            entity.HasIndex(b => b.Category);
            entity.HasIndex(b => b.ShelfLocation);
        });
    }
}
