using AuthorService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthorService.Data;

public class AuthorDbContext(DbContextOptions<AuthorDbContext> options) : DbContext(options)
{
    public DbSet<Author> Authors => Set<Author>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Author>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Name).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Biography).HasMaxLength(4000);
            entity.Property(a => a.Nationality).HasMaxLength(100);
            entity.HasIndex(a => a.Name).IsUnique();
            entity.HasIndex(a => a.IsActive);
            entity.HasIndex(a => a.Nationality);
        });
    }
}
