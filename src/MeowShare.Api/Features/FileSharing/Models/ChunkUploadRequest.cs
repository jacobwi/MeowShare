#region

using System.ComponentModel.DataAnnotations;

#endregion

namespace MeowShare.Api.Features.FileSharing.Models;

public class ChunkUploadRequest
{
    [Required] public IFormFile Chunk { get; set; } = null!;

    [Required] public string FileId { get; set; } = string.Empty;

    [Required] public int ChunkNumber { get; set; }

    [Required] public int TotalChunks { get; set; }

    [Required] public string FileName { get; set; } = string.Empty;

    public string? CustomUrl { get; set; }
    public string? Password { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxDownloads { get; set; }
    public List<string>? Tags { get; set; }
    public string? FolderPath { get; set; }
}