#region

using System.Text.Json;
using MeowShare.Api.Features.Admin.Models.Email;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public class EmailTemplateRepository : IEmailTemplateRepository
{
    private readonly string _dataPath;
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

    public EmailTemplateRepository(IConfiguration configuration)
    {
        var dataPath = configuration["DataStorage:Path"] ?? "App_Data";
        _dataPath = Path.Combine(dataPath, "EmailTemplates");

        if (!Directory.Exists(_dataPath)) Directory.CreateDirectory(_dataPath);
    }

    private string GetTemplateFilePath(Guid id)
    {
        return Path.Combine(_dataPath, $"{id}.json");
    }

    public async Task<EmailTemplate?> GetByIdAsync(Guid id)
    {
        var filePath = GetTemplateFilePath(id);
        if (!File.Exists(filePath)) return null;

        var json = await File.ReadAllTextAsync(filePath);
        return JsonSerializer.Deserialize<EmailTemplate>(json);
    }

    public async Task<EmailTemplate?> GetByNameAsync(string name)
    {
        var templates = await GetAllAsync();
        return templates.FirstOrDefault(t => t.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IEnumerable<EmailTemplate>> GetAllAsync()
    {
        var templates = new List<EmailTemplate>();

        if (!Directory.Exists(_dataPath)) return templates;

        var files = Directory.GetFiles(_dataPath, "*.json");
        foreach (var file in files)
            try
            {
                var json = await File.ReadAllTextAsync(file);
                var template = JsonSerializer.Deserialize<EmailTemplate>(json);
                if (template != null) templates.Add(template);
            }
            catch (Exception)
            {
                // Skip invalid files
            }

        return templates;
    }

    public async Task<EmailTemplate> CreateAsync(EmailTemplate template)
    {
        if (template.Id == Guid.Empty) template.Id = Guid.NewGuid();

        template.CreatedAt = DateTime.UtcNow;
        template.UpdatedAt = null;

        var json = JsonSerializer.Serialize(template, _jsonOptions);
        await File.WriteAllTextAsync(GetTemplateFilePath(template.Id), json);

        return template;
    }

    public async Task<bool> UpdateAsync(EmailTemplate template)
    {
        var existing = await GetByIdAsync(template.Id);
        if (existing == null) return false;

        template.CreatedAt = existing.CreatedAt;
        template.UpdatedAt = DateTime.UtcNow;

        var json = JsonSerializer.Serialize(template, _jsonOptions);
        await File.WriteAllTextAsync(GetTemplateFilePath(template.Id), json);

        return true;
    }

    public Task<bool> DeleteAsync(Guid id)
    {
        var filePath = GetTemplateFilePath(id);
        if (!File.Exists(filePath)) return Task.FromResult(false);

        File.Delete(filePath);
        return Task.FromResult(true);
    }
}