#region

using MeowShare.Api.Data;
using MeowShare.Api.Features.Profile.Models;
using MeowShare.Api.Features.Profile.Services;
using Microsoft.EntityFrameworkCore;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public class ApplicationUserRepository : IApplicationUserRepository
{
    private readonly AppDbContext _context;
    private readonly IAvatarService _avatarService;

    public ApplicationUserRepository(AppDbContext context, IAvatarService avatarService)
    {
        _context = context;
        _avatarService = avatarService;
    }

    public async Task<ApplicationUser?> GetByIdAsync(string id)
    {
        var user = await _context.Users.OfType<ApplicationUser>().FirstOrDefaultAsync(u => u.Id == id);
        if (user != null) user.ProfileImageFileName = _avatarService.GetAvatarUrl(id);
        return user;
    }

    public async Task<ApplicationUser?> GetByEmailAsync(string email)
    {
        var user = await _context.Users.OfType<ApplicationUser>()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == email.ToUpperInvariant());
        if (user != null) user.ProfileImageFileName = _avatarService.GetAvatarUrl(user.Id);
        return user;
    }

    public async Task<ApplicationUser?> GetByUserNameAsync(string userName)
    {
        var user = await _context.Users.OfType<ApplicationUser>()
            .FirstOrDefaultAsync(u => u.NormalizedUserName == userName.ToUpperInvariant());
        if (user != null) user.ProfileImageFileName = _avatarService.GetAvatarUrl(user.Id);
        return user;
    }

    public async Task<IEnumerable<ApplicationUser>> GetAllAsync()
    {
        var users = await _context.Users.OfType<ApplicationUser>().ToListAsync();
        foreach (var user in users) user.ProfileImageFileName = _avatarService.GetAvatarUrl(user.Id);
        return users;
    }

    public async Task<ApplicationUser> CreateAsync(ApplicationUser user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> UpdateAsync(ApplicationUser user)
    {
        _context.Users.Update(user);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var user = await GetByIdAsync(id);
        if (user == null) return false;

        // Delete avatar if exists
        _avatarService.DeleteAvatar(id);

        _context.Users.Remove(user);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateProfileAsync(string userId, string? displayName, string? bio, string? timeZoneId,
        string? languageCode)
    {
        var user = await GetByIdAsync(userId);
        if (user == null) return false;

        user.DisplayName = displayName;
        user.Bio = bio;
        user.TimeZoneId = timeZoneId;
        user.LanguageCode = languageCode;
        user.ProfileUpdatedAt = DateTimeOffset.UtcNow;

        return await UpdateAsync(user);
    }

    public async Task<bool> UpdateProfileImageAsync(string userId, IFormFile? file)
    {
        if (file == null) return false;

        var user = await GetByIdAsync(userId);
        if (user == null) return false;

        try
        {
            var avatarUrl = await _avatarService.SaveAvatarAsync(userId, file);
            if (avatarUrl != null)
            {
                user.ProfileImageFileName = avatarUrl;
                user.ProfileImageContentType = file.ContentType;
                user.ProfileUpdatedAt = DateTimeOffset.UtcNow;
                return await UpdateAsync(user);
            }
        }
        catch (ArgumentException)
        {
            // Log the error but don't throw it
        }

        return false;
    }
}