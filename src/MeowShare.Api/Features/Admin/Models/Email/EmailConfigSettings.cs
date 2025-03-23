#region

using System.Text.Json.Serialization;

#endregion

namespace MeowShare.Api.Features.Admin.Models.Email;

public class EmailConfigSettings
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SmtpPassword { get; set; }

    public string SmtpFromEmail { get; set; } = string.Empty;
    public string? SmtpFromName { get; set; }
    public bool EnableSsl { get; set; } = true;
}