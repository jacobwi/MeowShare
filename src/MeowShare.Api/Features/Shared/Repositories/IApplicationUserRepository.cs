#region

using MeowShare.Api.Features.Profile.Models;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public interface IApplicationUserRepository
{
    Task<ApplicationUser?> GetByIdAsync(string id);
    Task<ApplicationUser?> GetByEmailAsync(string email);
    Task<ApplicationUser?> GetByUserNameAsync(string userName);
    Task<IEnumerable<ApplicationUser>> GetAllAsync();
    Task<ApplicationUser> CreateAsync(ApplicationUser user);
    Task<bool> UpdateAsync(ApplicationUser user);
    Task<bool> DeleteAsync(string id);

    // Profile-specific methods
    Task<bool> UpdateProfileAsync(string userId, string? displayName, string? bio, string? timeZoneId,
        string? languageCode);

    Task<bool> UpdateProfileImageAsync(string userId, IFormFile? file);
}