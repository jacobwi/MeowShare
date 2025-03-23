#region

using MeowShare.Api.Features.FileSharing.Models;
using Microsoft.Extensions.Caching.Memory;

#endregion

namespace MeowShare.Api.Features.FileSharing.Services;

public class ChunkedUploadService
{
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _config;
    private readonly int _chunkTimeoutMinutes;

    public ChunkedUploadService(IMemoryCache cache, IConfiguration config)
    {
        _cache = cache;
        _config = config;
        _chunkTimeoutMinutes = config.GetValue<int>("FileStorage:ChunkTimeoutMinutes", 30);
    }

    public async Task<string> SaveChunkAsync(ChunkUploadRequest request)
    {
        var uploadPath = _config["FileStorage:Path"] ?? "uploads";

        // Ensure uploadPath is absolute
        if (!Path.IsPathRooted(uploadPath))
        {
            var contentRoot = AppDomain.CurrentDomain.BaseDirectory;
            uploadPath = Path.Combine(contentRoot, uploadPath);
        }

        var tempDir = Path.Combine(uploadPath, "temp", request.FileId);
        Directory.CreateDirectory(tempDir);

        var chunkPath = Path.Combine(tempDir, $"chunk_{request.ChunkNumber}");
        await using (var stream = File.Create(chunkPath))
        {
            await request.Chunk.CopyToAsync(stream);
        }

        // Cache chunk info
        var cacheKey = $"chunk_{request.FileId}_{request.ChunkNumber}";
        _cache.Set(cacheKey, chunkPath, TimeSpan.FromMinutes(_chunkTimeoutMinutes));

        // Check if all chunks are received
        var receivedChunks = Directory.GetFiles(tempDir).Length;
        if (receivedChunks == request.TotalChunks) return await MergeChunksAsync(request);

        return string.Empty;
    }

    private async Task<string> MergeChunksAsync(ChunkUploadRequest request)
    {
        var uploadPath = _config["FileStorage:Path"] ?? "uploads";

        // Ensure uploadPath is absolute
        if (!Path.IsPathRooted(uploadPath))
        {
            var contentRoot = AppDomain.CurrentDomain.BaseDirectory;
            uploadPath = Path.Combine(contentRoot, uploadPath);
        }

        var tempDir = Path.Combine(uploadPath, "temp", request.FileId);
        var uniqueFileName = $"{Guid.NewGuid()}_{request.FileName}";
        var finalPath = Path.Combine(uploadPath, request.FolderPath ?? string.Empty, uniqueFileName);

        Directory.CreateDirectory(Path.GetDirectoryName(finalPath)!);

        // Merge all chunks
        await using var output = File.Create(finalPath);
        for (var i = 1; i <= request.TotalChunks; i++)
        {
            var chunkPath = Path.Combine(tempDir, $"chunk_{i}");
            if (!File.Exists(chunkPath)) throw new InvalidOperationException($"Missing chunk {i}");

            await using var input = File.OpenRead(chunkPath);
            await input.CopyToAsync(output);
        }

        // Cleanup temp files
        try
        {
            Directory.Delete(tempDir, true);
        }
        catch (Exception)
        {
            // Log but don't fail if cleanup fails
        }

        return finalPath;
    }

    public void CleanupExpiredChunks()
    {
        var uploadPath = _config["FileStorage:Path"] ?? "uploads";

        // Ensure uploadPath is absolute
        if (!Path.IsPathRooted(uploadPath))
        {
            var contentRoot = AppDomain.CurrentDomain.BaseDirectory;
            uploadPath = Path.Combine(contentRoot, uploadPath);
        }

        var tempDir = Path.Combine(uploadPath, "temp");
        if (!Directory.Exists(tempDir)) return;

        foreach (var dir in Directory.GetDirectories(tempDir))
            try
            {
                var dirInfo = new DirectoryInfo(dir);
                if (dirInfo.LastWriteTime < DateTime.UtcNow.AddMinutes(-_chunkTimeoutMinutes))
                    Directory.Delete(dir, true);
            }
            catch (Exception)
            {
                // Log but continue with other directories
            }
    }
}