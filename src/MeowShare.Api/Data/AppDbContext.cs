#region

using Microsoft.EntityFrameworkCore;
using Moka.Auth.Data.Context;
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
    }
}