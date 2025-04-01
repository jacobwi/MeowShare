#region

using System.Text;
using System.Text.Json;
using MeowShare.Api.Features.Admin.Models;
using MeowShare.Api.Features.Shared.Repositories;
using Microsoft.AspNetCore.Mvc;
using DomainFileShare = MeowShare.Api.Features.Shared.Models.FileShare;

#endregion

namespace MeowShare.Api.Features.Admin;

public static class Endpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin")
            .WithTags("Admin")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        // Get all files
        group.MapGet(
            "/files",
            async (IFileShareRepository repo, HttpContext _) =>
            {
                var files = await repo.GetAllFilesAsync();
                return Results.Ok(files);
            }
        );

        // Get file metadata
        group.MapGet(
            "/files/{id}/metadata",
            async (Guid id, IFileShareRepository repo, HttpContext _) =>
            {
                var file = await repo.GetByIdAsync(id);
                if (file is null)
                    return Results.NotFound();

                // Get file info
                var fileInfo = new FileInfo(file.FilePath);
                if (!fileInfo.Exists)
                    return Results.NotFound("File not found on server");

                var metadata = new
                {
                    file.Id,
                    file.FileName,
                    file.CustomUrl,
                    file.CreatedAt,
                    file.ExpiresAt,
                    file.MaxDownloads,
                    file.CurrentDownloads,
                    file.Tags,
                    file.FolderPath,
                    file.UserId,
                    FileSize = fileInfo.Length,
                    LastModified = fileInfo.LastWriteTime,
                    Extension = fileInfo.Extension,
                    IsPasswordProtected = !string.IsNullOrEmpty(file.Password)
                };

                return Results.Ok(metadata);
            }
        );

        // Delete a file
        group.MapDelete(
            "/files/{id}",
            async (Guid id, IFileShareRepository repo, HttpContext _) =>
            {
                var file = await repo.GetByIdAsync(id);
                if (file is null)
                    return Results.NotFound();

                var deleted = await repo.DeleteAsync(id);
                if (deleted)
                {
                    // Delete the physical file
                    if (File.Exists(file.FilePath)) File.Delete(file.FilePath);
                    return Results.Ok();
                }

                return Results.NotFound();
            }
        );

        // Update a file
        group.MapPut(
            "/files/{id}",
            async (
                Guid id,
                [FromBody] DomainFileShare updates,
                IFileShareRepository repo,
                HttpContext _
            ) =>
            {
                var file = await repo.GetByIdAsync(id);
                if (file is null)
                    return Results.NotFound();

                // Apply updates (ignoring certain fields)
                file.CustomUrl = updates.CustomUrl;
                file.Password = updates.Password;
                file.ExpiresAt = updates.ExpiresAt;
                file.MaxDownloads = updates.MaxDownloads;
                file.Tags = updates.Tags ?? file.Tags;
                file.FolderPath = updates.FolderPath;

                var updated = await repo.UpdateAsync(file);
                if (updated) return Results.Ok(file);

                return Results.Problem("Failed to update file");
            }
        );

        // Get file statistics
        group.MapGet(
            "/files/stats",
            async (IFileShareRepository repo, HttpContext _) =>
            {
                var files = await repo.GetAllFilesAsync();
                var stats = new FileStats
                {
                    TotalFiles = files.Count(),
                    FilesByType = new Dictionary<string, int>(),
                    PasswordProtectedFiles = files.Count(f => !string.IsNullOrEmpty(f.Password)),
                    ExpiredFiles = files.Count(f =>
                        f.ExpiresAt.HasValue && f.ExpiresAt.Value < DateTime.UtcNow
                    )
                };

                long totalSize = 0;
                foreach (var file in files)
                    try
                    {
                        if (File.Exists(file.FilePath))
                        {
                            var fileInfo = new FileInfo(file.FilePath);
                            totalSize += fileInfo.Length;

                            var extension = Path.GetExtension(file.FileName)
                                .TrimStart('.')
                                .ToLowerInvariant();
                            if (string.IsNullOrEmpty(extension))
                                extension = "unknown";

                            if (stats.FilesByType.TryGetValue(extension, out var count))
                                stats.FilesByType[extension] = count + 1;
                            else
                                stats.FilesByType[extension] = 1;
                        }
                    }
                    catch (Exception)
                    {
                        // Skip files with issues
                    }

                stats.TotalSize = totalSize;
                return Results.Ok(stats);
            }
        );

        // Batch operations
        group.MapPost(
            "/files/batch",
            async (
                [FromBody] BatchOperationRequest request,
                IFileShareRepository repo,
                HttpContext _
            ) =>
            {
                if (request.Operation.ToLowerInvariant() == "delete")
                {
                    var successCount = 0;
                    foreach (var fileId in request.FileIds)
                        try
                        {
                            var file = await repo.GetByIdAsync(fileId);
                            if (file != null)
                            {
                                var deleted = await repo.DeleteAsync(fileId);
                                if (deleted && File.Exists(file.FilePath)) File.Delete(file.FilePath);
                                if (deleted)
                                    successCount++;
                            }
                        }
                        catch (Exception)
                        {
                            // Log error but continue with other files
                        }

                    return Results.Ok(
                        new { SuccessCount = successCount, TotalCount = request.FileIds.Count() }
                    );
                }

                return Results.BadRequest($"Unsupported operation: {request.Operation}");
            }
        );

        // Cleanup expired files
        group.MapPost(
            "/files/cleanup",
            async (IFileShareRepository repo, HttpContext _) =>
            {
                var expiredFiles = await repo.GetExpiredFilesAsync();
                var deletedCount = 0;

                foreach (var file in expiredFiles)
                    try
                    {
                        var deleted = await repo.DeleteAsync(file.Id);
                        if (deleted)
                        {
                            deletedCount++;

                            // Delete physical file
                            if (File.Exists(file.FilePath)) File.Delete(file.FilePath);
                        }
                    }
                    catch (Exception)
                    {
                        // Log error but continue with other files
                    }

                return Results.Ok(new CleanupResult { DeletedCount = deletedCount });
            }
        );

        // Export file data
        group.MapGet(
            "/files/export",
            async (IFileShareRepository repo, HttpContext _) =>
            {
                var files = await repo.GetAllFilesAsync();
                var json = JsonSerializer.Serialize(
                    files,
                    new JsonSerializerOptions { WriteIndented = true }
                );

                var bytes = Encoding.UTF8.GetBytes(json);
                return Results.File(
                    bytes,
                    "application/json",
                    $"meowshare_export_{DateTime.UtcNow:yyyyMMddHHmmss}.json"
                );
            }
        );

        return app;
    }
}