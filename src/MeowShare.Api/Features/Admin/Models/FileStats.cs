namespace MeowShare.Api.Features.Admin.Models;

public class FileStats
{
    public int TotalFiles { get; set; }
    public long TotalSize { get; set; }
    public Dictionary<string, int> FilesByType { get; set; } = new();
    public int ExpiredFiles { get; set; }
    public int PasswordProtectedFiles { get; set; }
}