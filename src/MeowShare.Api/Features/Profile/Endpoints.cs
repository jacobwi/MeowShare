#region

using System.Security.Claims;
using MeowShare.Api.Features.Profile.Services;
using MeowShare.Api.Features.Shared.Repositories;
using Microsoft.AspNetCore.Mvc;

#endregion

namespace MeowShare.Api.Features.Profile;

public static class Endpoints
{
    private static Guid GetUserIdFromContext(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            throw new UnauthorizedAccessException("User ID not found in claims");
        return userId;
    }

    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        // Public avatar endpoint (no authorization required)
        app.MapGet(
            "/api/profile/avatar/{fileName}",
            async (string fileName) =>
            {
                
                var avatarPath = Path.Combine(
                    AppDomain.CurrentDomain.BaseDirectory,
                    "wwwroot",
                    "avatars",
                    fileName
                );

                if (!File.Exists(avatarPath))
                    return Results.NotFound();

                // Get content type from file extension
                var contentType = Path.GetExtension(fileName).ToLower() switch
                {
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    ".gif" => "image/gif",
                    _ => "application/octet-stream"
                };

                return Results.File(avatarPath, contentType);
            }
        );

        // Protected profile endpoints
        var group = app.MapGroup("/api/profile").WithTags("Profile").RequireAuthorization();

        // Get current user's profile
        group.MapGet(
            "/",
            async (HttpContext context, [FromServices] IApplicationUserRepository userRepo) =>
            {
                var userId = GetUserIdFromContext(context);
                var user = await userRepo.GetByIdAsync(userId.ToString());
                if (user == null)
                    return Results.NotFound();

                // Return just the filename for profileImageFileName
                var profileImageFileName = user.ProfileImageFileName != null
                    ? Path.GetFileName(user.ProfileImageFileName)
                    : null;

                // Construct full avatar URL
                var avatarUrl = user.ProfileImageFileName != null
                    ? $"/api/profile/avatar/{profileImageFileName}"
                    : null;

                return Results.Ok(
                    new
                    {
                        user.Id,
                        user.UserName,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        user.DisplayName,
                        user.Bio,
                        ProfileImageFileName = profileImageFileName,
                        user.ProfileImageContentType,
                        user.ProfileUpdatedAt,
                        user.CreatedAt,
                        user.LastLoginAt,
                        AvatarUrl = avatarUrl
                    }
                );
            }
        );

        // Update profile
        group.MapPut(
            "/",
            async (
                [FromBody] ProfileUpdateRequest request,
                HttpContext context,
                [FromServices] IApplicationUserRepository userRepo
            ) =>
            {
                var userId = GetUserIdFromContext(context);
                var success = await userRepo.UpdateProfileAsync(
                    userId.ToString(),
                    request.DisplayName,
                    request.Bio,
                    request.TimeZoneId,
                    request.LanguageCode
                );

                if (!success)
                    return Results.NotFound();

                return Results.Ok();
            }
        );

        // Update profile image
        group
            .MapPut(
                "/avatar",
                async (
                    [FromForm] IFormFile file,
                    [FromServices] IApplicationUserRepository userRepo,
                    [FromServices] IAvatarService avatarService,
                    HttpContext context
                ) =>
                {
                    var userId = GetUserIdFromContext(context);
                    var user = await userRepo.GetByIdAsync(userId.ToString());
                    if (user is null) return Results.NotFound();

                    var avatarUrl = await avatarService.SaveAvatarAsync(userId.ToString(), file);
                    if (avatarUrl != null)
                    {
                        user.ProfileImageFileName = Path.GetFileName(avatarUrl);
                        user.ProfileImageContentType = file.ContentType;
                        user.ProfileUpdatedAt = DateTimeOffset.UtcNow;
                        await userRepo.UpdateAsync(user);

                        return Results.Ok(new { 
                            AvatarUrl = $"/api/profile/avatar/{user.ProfileImageFileName}",
                            ProfileImageFileName = user.ProfileImageFileName,
                            ContentType = file.ContentType
                        });
                    }

                    return Results.Ok(new { avatarUrl });
                }
            )
            .DisableAntiforgery();

        // Get profile stats
        group.MapGet(
            "/stats",
            async (HttpContext context, [FromServices] IApplicationUserRepository userRepo) =>
            {
                var userId = GetUserIdFromContext(context);
                var user = await userRepo.GetByIdAsync(userId.ToString());
                if (user == null)
                    return Results.NotFound();

                // TODO: Implement actual stats calculation
                return Results.Ok(new { FilesShared = 0, TotalDownloads = 0 });
            }
        );

        return app;
    }
}

public class ProfileUpdateRequest
{
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? TimeZoneId { get; set; }
    public string? LanguageCode { get; set; }
}