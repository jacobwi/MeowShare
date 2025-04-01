#region

using Microsoft.EntityFrameworkCore;
using Moka.Auth.Data.Context;
using ApplicationUser = MeowShare.Api.Features.Profile.Models.ApplicationUser;
using DomainFileShare = MeowShare.Api.Features.Shared.Models.FileShare;

#endregion

namespace MeowShare.Api.Data;

public class AppDbContext : MokaAuthDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) // This will call the protected constructor
    {
    }

    public DbSet<DomainFileShare> FileShares => Set<DomainFileShare>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DomainFileShare>(builder =>
        {
            builder.HasKey(f => f.Id);
            builder.Property(f => f.Tags).HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
        });

        modelBuilder.Entity<ApplicationUser>(builder =>
        {
            builder.Property(u => u.ProfileImageFileName).HasMaxLength(255);

            builder.Property(u => u.ProfileImageContentType).HasMaxLength(100);

            builder.Property(u => u.DisplayName).HasMaxLength(100);

            builder.Property(u => u.Bio).HasMaxLength(500);

            builder.Property(u => u.TimeZoneId).HasMaxLength(50);

            builder.Property(u => u.LanguageCode).HasMaxLength(10);

            builder.Property(u => u.ProfileUpdatedAt)
                .HasDefaultValue(new DateTimeOffset(2024, 1, 1, 0, 0, 0, TimeSpan.Zero));
        });
    }
}