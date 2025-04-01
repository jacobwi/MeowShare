#region

using MeowShare.Api.Data;
using Microsoft.EntityFrameworkCore;
using DomainFileShare = MeowShare.Api.Features.Shared.Models.FileShare;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public class FileShareRepository(AppDbContext context) : IFileShareRepository
{
    public async Task<DomainFileShare> CreateAsync(DomainFileShare fileShare)
    {
        context.FileShares.Add(fileShare);
        await context.SaveChangesAsync();
        return fileShare;
    }

    public async Task<DomainFileShare?> GetByIdAsync(Guid id)
    {
        return await context.FileShares.FindAsync(id);
    }

    public async Task<DomainFileShare?> GetByCustomUrlAsync(string customUrl)
    {
        return await context.FileShares
            .FirstOrDefaultAsync(f => f.CustomUrl == customUrl);
    }

    public async Task<IEnumerable<DomainFileShare>> GetByUserIdAsync(Guid userId)
    {
        return await context.FileShares
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<DomainFileShare>> SearchByTagsAsync(IEnumerable<string> tags)
    {
        var tagList = tags.ToList();
        return await context.FileShares
            .Where(f => f.Tags.Any(t => tagList.Contains(t)))
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> UpdateAsync(DomainFileShare fileShare)
    {
        context.FileShares.Update(fileShare);
        return await context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var fileShare = await GetByIdAsync(id);
        if (fileShare is null) return false;

        context.FileShares.Remove(fileShare);
        return await context.SaveChangesAsync() > 0;
    }

    public async Task<bool> IncrementDownloadCountAsync(Guid id)
    {
        var fileShare = await GetByIdAsync(id);
        if (fileShare is null) return false;

        fileShare.CurrentDownloads++;
        return await UpdateAsync(fileShare);
    }

    public async Task<IEnumerable<DomainFileShare>> GetExpiredFilesAsync()
    {
        var now = DateTime.UtcNow;
        return await context.FileShares
            .Where(f => (f.ExpiresAt != null && f.ExpiresAt < now) ||
                        (f.MaxDownloads != null && f.CurrentDownloads >= f.MaxDownloads))
            .ToListAsync();
    }

    public async Task<IEnumerable<DomainFileShare>> GetAllFilesAsync()
    {
        return await context.FileShares
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }
}