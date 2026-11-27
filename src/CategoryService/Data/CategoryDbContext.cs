using CategoryService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Data;

namespace CategoryService.Data;

public class CategoryDbContext(DbContextOptions<CategoryDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ConfigureSpstDbFunctions();
        modelBuilder.ApplyLowercaseGuidText();
        modelBuilder.ApplyForNpgsql(this);

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
            entity.Property(c => c.Description).HasMaxLength(1000);
            entity.Property(c => c.Color).HasMaxLength(32);
            entity.HasIndex(c => c.Name).IsUnique();
            entity.HasIndex(c => c.IsActive);
        });
    }
}
