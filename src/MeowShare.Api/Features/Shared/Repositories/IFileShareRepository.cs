#region

using DomainFileShare = MeowShare.Api.Features.Shared.Models.FileShare;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public interface IFileShareRepository
{
    Task<DomainFileShare> CreateAsync(DomainFileShare fileShare);
    Task<DomainFileShare?> GetByIdAsync(Guid id);
    Task<DomainFileShare?> GetByCustomUrlAsync(string customUrl);
    Task<IEnumerable<DomainFileShare>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<DomainFileShare>> SearchByTagsAsync(IEnumerable<string> tags);
    Task<bool> UpdateAsync(DomainFileShare fileShare);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> IncrementDownloadCountAsync(Guid id);
    Task<IEnumerable<DomainFileShare>> GetExpiredFilesAsync();

    // Admin-specific methods
    Task<IEnumerable<DomainFileShare>> GetAllFilesAsync();
}