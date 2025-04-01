namespace MeowShare.Api.Features.Profile.Services;

public interface IAvatarService
{
    Task<string?> SaveAvatarAsync(string userId, IFormFile file);
    bool DeleteAvatar(string userId);
    string? GetAvatarUrl(string userId);
}

public class AvatarService : IAvatarService
{
    private readonly string _avatarBasePath;
    private readonly string _avatarBaseUrl;
    private readonly IConfiguration _configuration;

    public AvatarService(IConfiguration configuration)
    {
        _configuration = configuration;
        _avatarBasePath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "wwwroot",
            "avatars"
        );
        _avatarBaseUrl = "/api/profile/avatar";

        // Ensure avatar directory exists
        if (!Directory.Exists(_avatarBasePath)) Directory.CreateDirectory(_avatarBasePath);
    }

    public async Task<string?> SaveAvatarAsync(string userId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return null;

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            throw new ArgumentException("Invalid file type. Only JPEG, PNG and GIF are allowed.");

        // Validate file size (max 5MB)
        if (file.Length > 5 * 1024 * 1024)
            throw new ArgumentException("File size exceeds 5MB limit.");

        // Generate unique filename
        var extension = Path.GetExtension(file.FileName);
        var fileName = $"{userId}{extension}";
        var filePath = Path.Combine(_avatarBasePath, fileName);

        // Delete existing avatar if any
        DeleteAvatar(userId);

        // Save new avatar
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return GetAvatarUrl(userId);
    }

    public bool DeleteAvatar(string userId)
    {
        var files = Directory.GetFiles(_avatarBasePath, $"{userId}.*");
        foreach (var file in files)
            try
            {
                if (File.Exists(file)) File.Delete(file);
            }
            catch (Exception)
            {
                // Log error but continue with other files
            }

        return true;
    }

    public string? GetAvatarUrl(string userId)
    {
        var files = Directory.GetFiles(_avatarBasePath, $"{userId}.*");
        if (!files.Any())
            return null;

        var fileName = Path.GetFileName(files.First());
        return $"{_avatarBaseUrl}/{fileName}";
    }
}