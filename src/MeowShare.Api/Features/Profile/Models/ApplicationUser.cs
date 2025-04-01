#region

using Moka.Auth.Core.Entities;

#endregion

namespace MeowShare.Api.Features.Profile.Models;

public class ApplicationUser : MokaUser
{
    /// <summary>
    /// Gets or sets the user's display name
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Gets or sets the user's profile image file name
    /// </summary>
    public string? ProfileImageFileName { get; set; }

    /// <summary>
    /// Gets or sets the user's profile image content type (e.g., "image/jpeg")
    /// </summary>
    public string? ProfileImageContentType { get; set; }

    /// <summary>
    /// Gets or sets when the profile was last updated
    /// </summary>
    public DateTimeOffset? ProfileUpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the user's bio/about text
    /// </summary>
    public string? Bio { get; set; }

    /// <summary>
    /// Gets or sets the user's timezone ID (e.g., "America/New_York")
    /// </summary>
    public string? TimeZoneId { get; set; }

    /// <summary>
    /// Gets or sets the user's preferred language code (e.g., "en-US")
    /// </summary>
    public string? LanguageCode { get; set; }
}