namespace MeowShare.Api.Features.FileSharing.Models;

public class ShareFileRequest
{
    public string? CustomUrl { get; set; }
    public string? Password { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxDownloads { get; set; }
    public List<string>? Tags { get; set; }
    public string? FolderPath { get; set; }
}