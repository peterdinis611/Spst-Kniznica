using EmailService.Models;
using Microsoft.EntityFrameworkCore;

namespace EmailService.Data;

public sealed class EmailDbContext(DbContextOptions<EmailDbContext> options) : DbContext(options)
{
    public DbSet<EmailMessageLog> Messages => Set<EmailMessageLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var message = modelBuilder.Entity<EmailMessageLog>();
        message.ToTable("email_messages");
        message.HasKey(x => x.Id);
        message.Property(x => x.ToAddress).HasMaxLength(320).IsRequired();
        message.Property(x => x.ToName).HasMaxLength(200);
        message.Property(x => x.Subject).HasMaxLength(500).IsRequired();
        message.Property(x => x.BodyText).IsRequired();
        message.Property(x => x.TemplateKey).HasMaxLength(100);
        message.Property(x => x.CorrelationId).HasMaxLength(100);
        message.Property(x => x.Error).HasMaxLength(2000);
        message.Property(x => x.AttemptCount).HasDefaultValue(0);
        message.Property(x => x.Status).HasConversion<int>();
        message.HasIndex(x => x.CreatedAt);
        message.HasIndex(x => x.Status);
        message.HasIndex(x => x.ToAddress);
        message.HasIndex(x => x.TemplateKey);
    }
}
