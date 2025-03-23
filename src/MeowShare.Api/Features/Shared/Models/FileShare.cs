#region

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

#endregion

namespace MeowShare.Api.Features.Shared.Models;

[Table("FileShares")]
public class FileShare
{
    [Key] public Guid Id { get; set; }

    [Required] [MaxLength(255)] public string FileName { get; set; } = string.Empty;

    [Required] public string FilePath { get; set; } = string.Empty;

    [MaxLength(255)] public string? CustomUrl { get; set; }

    [MaxLength(255)] public string? Password { get; set; }

    [Required] public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public int? MaxDownloads { get; set; }

    [Required] public int CurrentDownloads { get; set; }

    public List<string> Tags { get; set; } = new();

    [MaxLength(255)] public string? FolderPath { get; set; }

    [Required] public Guid UserId { get; set; }
}