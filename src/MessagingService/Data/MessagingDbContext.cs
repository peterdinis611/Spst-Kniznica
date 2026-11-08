using MessagingService.Models;
using Microsoft.EntityFrameworkCore;

namespace MessagingService.Data;

public class MessagingDbContext(DbContextOptions<MessagingDbContext> options) : DbContext(options)
{
    public DbSet<CategoryProjection> Categories => Set<CategoryProjection>();
    public DbSet<AuthorProjection> Authors => Set<AuthorProjection>();
    public DbSet<BookProjection> Books => Set<BookProjection>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CategoryProjection>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
            entity.Property(c => c.Description).HasMaxLength(500);
            entity.HasIndex(c => c.Name);
        });

        modelBuilder.Entity<AuthorProjection>(entity =>
        {
            entity.ToTable("Authors");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Name).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Nationality).HasMaxLength(100);
            entity.HasIndex(a => a.Name);
        });

        modelBuilder.Entity<BookProjection>(entity =>
        {
            entity.ToTable("Books");
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Title).HasMaxLength(300).IsRequired();
            entity.Property(b => b.Author).HasMaxLength(200).IsRequired();
            entity.Property(b => b.Isbn).HasMaxLength(32);
            entity.Property(b => b.CategoryName).HasMaxLength(100);
            entity.HasIndex(b => b.CategoryId);
            entity.HasIndex(b => b.AuthorId);

            entity.HasOne(b => b.Category)
                .WithMany(c => c.Books)
                .HasForeignKey(b => b.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(b => b.AuthorRef)
                .WithMany(a => a.Books)
                .HasForeignKey(b => b.AuthorId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
