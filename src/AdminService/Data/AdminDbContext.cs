using AdminService.Models;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Data;

public sealed class AdminDbContext(DbContextOptions<AdminDbContext> options) : DbContext(options)
{
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Action).HasMaxLength(120).IsRequired();
            entity.Property(x => x.EntityType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.EntityId).HasMaxLength(200).IsRequired();
            entity.Property(x => x.ActorIdHash).HasMaxLength(128);
            entity.Property(x => x.ActorEmail).HasMaxLength(256);
            entity.Property(x => x.ActorName).HasMaxLength(200);
            entity.Property(x => x.Roles).HasMaxLength(256);
            entity.Property(x => x.SourceService).HasMaxLength(80);
            entity.Property(x => x.DetailsJson).HasMaxLength(4000);
            entity.HasIndex(x => x.OccurredAt);
            entity.HasIndex(x => x.Action);
            entity.HasIndex(x => x.EntityType);
            entity.HasIndex(x => x.ActorEmail);
        });
    }
}
