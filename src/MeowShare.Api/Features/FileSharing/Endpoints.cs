#region

using System.Security.Claims;
using MeowShare.Api.Features.FileSharing.Models;
using MeowShare.Api.Features.FileSharing.Services;
using MeowShare.Api.Features.Shared.Repositories;
using Microsoft.AspNetCore.Mvc;
using DomainFileShare = MeowShare.Api.Features.Shared.Models.FileShare;

#endregion

namespace MeowShare.Api.Features.FileSharing;

public static class Endpoints
{
    public static IEndpointRouteBuilder MapFileSharingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/files").WithTags("File Sharing").RequireAuthorization();

        // Quick share - simple file upload
        group
            .MapPost(
                "/quick-share",
                async (
                    IFormFile file,
                    IFileShareRepository repo,
                    [FromServices] IConfiguration config,
                    HttpContext context
                ) =>
                {
                    // Validate file size
                    var maxFileSize = config.GetValue<long>("FileStorage:MaxFileSize", 104857600); // Default 100MB
                    if (file.Length > maxFileSize)
                        return Results.BadRequest(
                            $"File exceeds maximum allowed size of {maxFileSize / (1024 * 1024)}MB"
                        );

                    var userId = GetUserIdFromContext(context);
                    var fileShare = await QuickShareFile(file, userId, config);
                    return Results.Ok(await repo.CreateAsync(fileShare));
                }
            )
            .DisableAntiforgery();

        // Advanced share with metadata
        group
            .MapPost(
                "/share",
                async (
                    IFormFile file,
                    [FromForm] ShareFileRequest request,
                    IFileShareRepository repo,
                    [FromServices] IConfiguration config,
                    HttpContext context
                ) =>
                {
                    // Validate file size
                    var maxFileSize = config.GetValue<long>("FileStorage:MaxFileSize", 104857600); // Default 100MB
                    if (file.Length > maxFileSize)
                        return Results.BadRequest(
                            $"File exceeds maximum allowed size of {maxFileSize / (1024 * 1024)}MB"
                        );

                    var userId = GetUserIdFromContext(context);
                    // Initialize request if null
                    request ??= new ShareFileRequest();
                    request.Tags ??= new List<string>();
                    var fileShare = await ShareFileWithMetadata(file, request, userId, config);
                    return Results.Ok(await repo.CreateAsync(fileShare));
                }
            )
            .DisableAntiforgery();

        // Chunked upload
        group
            .MapPost(
                "/upload/chunk",
                async (
                    [FromForm] ChunkUploadRequest request,
                    IFileShareRepository repo,
                    ChunkedUploadService uploadService,
                    [FromServices] IConfiguration config,
                    HttpContext context
                ) =>
                {
                    // Validate chunk size
                    var maxChunkSize = config.GetValue<long>("FileStorage:ChunkSize", 5242880); // Default 5MB
                    if (request.Chunk.Length > maxChunkSize)
                        return Results.BadRequest(
                            $"Chunk exceeds maximum allowed size of {maxChunkSize / (1024 * 1024)}MB"
                        );

                    var userId = GetUserIdFromContext(context);
                    var filePath = await uploadService.SaveChunkAsync(request);

                    // If filePath is empty, chunk was saved but not all chunks received yet
                    if (string.IsNullOrEmpty(filePath)) return Results.Accepted();

                    // All chunks received and merged, create file share
                    var fileShare = new DomainFileShare
                    {
                        Id = Guid.NewGuid(),
                        FileName = request.FileName,
                        FilePath = filePath,
                        CustomUrl = request.CustomUrl,
                        Password = request.Password,
                        ExpiresAt = request.ExpiresAt,
                        MaxDownloads = request.MaxDownloads,
                        Tags = request.Tags ?? new List<string>(),
                        FolderPath = request.FolderPath,
                        CreatedAt = DateTime.UtcNow,
                        UserId = userId
                    };

                    var createdFile = await repo.CreateAsync(fileShare);
                    return Results.Ok(createdFile);
                }
            )
            .DisableAntiforgery();

        // Get file by ID or custom URL
        group.MapGet(
            "/{idOrUrl}",
            async (
                string idOrUrl,
                [FromQuery] string? password,
                [FromHeader(Name = "X-File-Password")] string? headerPassword,
                IFileShareRepository repo,
                [FromServices] IConfiguration config,
                HttpContext _
            ) =>
            {
                // Find the file record
                DomainFileShare? fileShare;
                if (Guid.TryParse(idOrUrl, out var id))
                    fileShare = await repo.GetByIdAsync(id);
                else
                    fileShare = await repo.GetByCustomUrlAsync(idOrUrl);

                // Use password from header if it exists, otherwise use query param
                var passwordToUse = !string.IsNullOrEmpty(headerPassword)
                    ? headerPassword
                    : password;

                // Validate file record
                if (fileShare is null)
                    return Results.NotFound();
                if (!ValidateFileShare(fileShare))
                    return Results.NotFound("File has expired or reached download limit");
                if (!ValidatePassword(fileShare, passwordToUse))
                    return Results.Unauthorized();

                // Use the file path directly (no normalization needed since we store absolute paths)
                var filePath = fileShare.FilePath;

                // Check if file exists
                if (!File.Exists(filePath))
                {
                    // Try alternative locations
                    var fileName = Path.GetFileName(filePath);
                    var uploadPath = config["FileStorage:Path"] ?? "uploads";
                    var alternatePath = Path.Combine(uploadPath, fileName);

                    // Check if file exists at the alternate path
                    if (File.Exists(alternatePath))
                    {
                        // Update database with correct path for future
                        fileShare.FilePath = alternatePath;
                        await repo.UpdateAsync(fileShare);
                        filePath = alternatePath;
                    }
                    else
                    {
                        // Log the issue
                        var errorMsg =
                            $"File not found: Original path '{fileShare.FilePath}', Normalized path '{filePath}'";
                        Console.WriteLine(errorMsg);
                        return Results.NotFound("File not found on server");
                    }
                }

                // Update download count
                await repo.IncrementDownloadCountAsync(fileShare.Id);

                // Return the file
                return Results.File(filePath, "application/octet-stream", fileShare.FileName);
            }
        );

        // Get user's files
        group.MapGet(
            "/my/files",
            async (IFileShareRepository repo, HttpContext context) =>
            {
                var userId = GetUserIdFromContext(context);
                return await repo.GetByUserIdAsync(userId);
            }
        );

        // Get file content as text (for preview)
        group.MapGet(
            "/{id}/content",
            async (
                string id,
                [FromHeader(Name = "X-File-Password")] string? password,
                IFileShareRepository repo,
                [FromServices] IConfiguration config,
                HttpContext _
            ) =>
            {
                // Find the file record
                DomainFileShare? fileShare;
                if (Guid.TryParse(id, out var fileId))
                    fileShare = await repo.GetByIdAsync(fileId);
                else
                    fileShare = await repo.GetByCustomUrlAsync(id);

                // Validate file record
                if (fileShare is null)
                    return Results.NotFound();
                if (!ValidateFileShare(fileShare))
                    return Results.NotFound("File has expired or reached download limit");
                if (!ValidatePassword(fileShare, password))
                    return Results.Unauthorized();

                // Use the file path directly
                var filePath = fileShare.FilePath;

                // Check if file exists
                if (!File.Exists(filePath))
                {
                    // Try alternative locations as we do for regular downloads
                    var fileName = Path.GetFileName(filePath);
                    var uploadPath = config["FileStorage:Path"] ?? "uploads";
                    var alternatePath = Path.Combine(uploadPath, fileName);

                    if (File.Exists(alternatePath))
                    {
                        fileShare.FilePath = alternatePath;
                        await repo.UpdateAsync(fileShare);
                        filePath = alternatePath;
                    }
                    else
                    {
                        return Results.NotFound("File not found on server");
                    }
                }

                try
                {
                    // Read the file content
                    var fileContent = await File.ReadAllTextAsync(filePath);

                    // Determine content type based on file extension
                    var extension = Path.GetExtension(fileShare.FileName)
                        .TrimStart('.')
                        .ToLowerInvariant();
                    var contentType = extension switch
                    {
                        "json" => "application/json",
                        "xml" => "application/xml",
                        "html" => "text/html",
                        "htm" => "text/html",
                        "css" => "text/css",
                        "js" => "application/javascript",
                        "txt" => "text/plain",
                        "md" => "text/markdown",
                        "csv" => "text/csv",
                        "yaml" => "application/yaml",
                        "yml" => "application/yaml",
                        _ => "text/plain"
                    };

                    // Return the content as text
                    return Results.Text(fileContent, contentType);
                }
                catch (Exception ex)
                {
                    // Log the error
                    Console.WriteLine($"Error reading file content: {ex.Message}");
                    return Results.Problem(
                        "Failed to read file content. The file may be in a binary format."
                    );
                }
            }
        );

        // Search by tags
        group.MapGet(
            "/search",
            async ([FromQuery] string[] tags, IFileShareRepository repo) =>
            await repo.SearchByTagsAsync(tags)
        );

        // Delete file
        group.MapDelete(
            "/{id}",
            async (Guid id, IFileShareRepository repo, HttpContext context) =>
            {
                var userId = GetUserIdFromContext(context);
                var file = await repo.GetByIdAsync(id);

                if (file is null)
                    return Results.NotFound();
                if (file.UserId != userId)
                    return Results.Forbid();

                var deleted = await repo.DeleteAsync(id);
                if (deleted)
                {
                    // Delete physical file
                    if (File.Exists(file.FilePath)) File.Delete(file.FilePath);
                    return Results.Ok();
                }

                return Results.NotFound();
            }
        );

        return app;
    }

    private static Guid GetUserIdFromContext(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            throw new UnauthorizedAccessException("User ID not found in claims");
        return userId;
    }

    private static async Task<DomainFileShare> QuickShareFile(
        IFormFile file,
        Guid userId,
        IConfiguration config
    )
    {
        var uploadPath = config["FileStorage:Path"] ?? "uploads";

        // Ensure uploadPath is absolute
        if (!Path.IsPathRooted(uploadPath))
        {
            var contentRoot = AppDomain.CurrentDomain.BaseDirectory;
            uploadPath = Path.Combine(contentRoot, uploadPath);
        }

        var fileName = Path.GetFileName(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(uploadPath, uniqueFileName);

        Directory.CreateDirectory(uploadPath);
        await using var stream = File.Create(filePath);
        await file.CopyToAsync(stream);

        return new DomainFileShare
        {
            Id = Guid.NewGuid(),
            FileName = fileName,
            FilePath = filePath,
            CreatedAt = DateTime.UtcNow,
            UserId = userId,
            Tags = []
        };
    }

    private static async Task<DomainFileShare> ShareFileWithMetadata(
        IFormFile file,
        ShareFileRequest request,
        Guid userId,
        IConfiguration config
    )
    {
        var uploadPath = config["FileStorage:Path"] ?? "uploads";

        // Ensure uploadPath is absolute
        if (!Path.IsPathRooted(uploadPath))
        {
            var contentRoot = AppDomain.CurrentDomain.BaseDirectory;
            uploadPath = Path.Combine(contentRoot, uploadPath);
        }

        if (!string.IsNullOrEmpty(request.FolderPath)) uploadPath = Path.Combine(uploadPath, request.FolderPath);

        var fileName = Path.GetFileName(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(uploadPath, uniqueFileName);

        Directory.CreateDirectory(uploadPath);
        await using var stream = File.Create(filePath);
        await file.CopyToAsync(stream);

        return new DomainFileShare
        {
            Id = Guid.NewGuid(),
            FileName = fileName,
            FilePath = filePath,
            CustomUrl = request.CustomUrl,
            Password = request.Password,
            ExpiresAt = request.ExpiresAt,
            MaxDownloads = request.MaxDownloads,
            Tags = request.Tags ?? new List<string>(),
            FolderPath = request.FolderPath,
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };
    }

    private static bool ValidateFileShare(DomainFileShare fileShare)
    {
        if (fileShare.ExpiresAt.HasValue && fileShare.ExpiresAt.Value < DateTime.UtcNow)
            return false;

        if (
            fileShare.MaxDownloads.HasValue
            && fileShare.CurrentDownloads >= fileShare.MaxDownloads.Value
        )
            return false;

        return true;
    }

    private static bool ValidatePassword(DomainFileShare fileShare, string? password)
    {
        if (string.IsNullOrEmpty(fileShare.Password)) return true;

        return fileShare.Password == password;
    }
}