#region

using System.Text.Json;
using MeowShare.Api.Features.Admin.Models.Email;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public class EmailConfigRepository : IEmailConfigRepository
{
    private readonly string _configFilePath;
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };
    private readonly IConfiguration _configuration;

    public EmailConfigRepository(IConfiguration configuration)
    {
        _configuration = configuration;
        var dataPath = configuration["DataStorage:Path"] ?? "App_Data";
        var emailConfigDir = Path.Combine(dataPath, "EmailConfig");

        if (!Directory.Exists(emailConfigDir))
            Directory.CreateDirectory(emailConfigDir);

        _configFilePath = Path.Combine(emailConfigDir, "config.json");
    }

    public async Task<EmailConfigSettings?> GetConfigAsync()
    {
        // Check for environment variables or configuration first
        var envConfig = GetConfigFromEnvironment();
        if (envConfig != null)
            return envConfig;

        // If no env config, try to read from file
        if (!File.Exists(_configFilePath))
            // Return default config if no file exists
            return new EmailConfigSettings
            {
                SmtpHost = "smtp.example.com",
                SmtpPort = 587,
                SmtpUser = "",
                SmtpPassword = "",
                SmtpFromEmail = "noreply@example.com",
                SmtpFromName = "MeowShare",
                EnableSsl = true
            };

        var json = await File.ReadAllTextAsync(_configFilePath);
        return JsonSerializer.Deserialize<EmailConfigSettings>(json);
    }

    public async Task<bool> SaveConfigAsync(EmailConfigSettings config)
    {
        try
        {
            var json = JsonSerializer.Serialize(config, _jsonOptions);
            await File.WriteAllTextAsync(_configFilePath, json);
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    private EmailConfigSettings? GetConfigFromEnvironment()
    {
        // Check if environment variables or configuration section exists
        var host = _configuration["EmailConfig:SmtpHost"];
        if (string.IsNullOrEmpty(host))
            return null;

        // Parse all email settings from configuration
        return new EmailConfigSettings
        {
            SmtpHost = host,
            SmtpPort = int.TryParse(_configuration["EmailConfig:SmtpPort"], out var port)
                ? port
                : 587,
            SmtpUser = _configuration["EmailConfig:SmtpUser"] ?? "",
            SmtpPassword = _configuration["EmailConfig:SmtpPassword"] ?? "",
            SmtpFromEmail = _configuration["EmailConfig:SmtpFromEmail"] ?? "noreply@example.com",
            SmtpFromName = _configuration["EmailConfig:SmtpFromName"] ?? "MeowShare",
            EnableSsl = bool.TryParse(_configuration["EmailConfig:EnableSsl"], out var ssl)
                ? ssl
                : true
        };
    }
}