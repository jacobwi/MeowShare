namespace MeowShare.Api.Features.Admin.Models.Email;

public class EmailOptions
{
    public string[] To { get; set; } = Array.Empty<string>();
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = false;
    public List<EmailAttachment>? Attachments { get; set; }
    public string[]? Cc { get; set; }
    public string[]? Bcc { get; set; }
    public string? ReplyTo { get; set; }
}

public class EmailAttachment
{
    public string Filename { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ContentType { get; set; }
}