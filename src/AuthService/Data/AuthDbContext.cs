using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public class AuthDbContext(DbContextOptions<AuthDbContext> options) : DbContext(options)
{
    public DbSet<AuthSettingsStore> AuthSettingsStore => Set<AuthSettingsStore>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuthSettingsStore>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).ValueGeneratedNever();
            entity.Property(s => s.RedirectUriHint).HasMaxLength(500).IsRequired();
            entity.Property(s => s.LoginNotice).HasMaxLength(2000);
        });
    }
}
