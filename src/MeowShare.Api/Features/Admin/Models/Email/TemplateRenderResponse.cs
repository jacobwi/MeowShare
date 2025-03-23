namespace MeowShare.Api.Features.Admin.Models.Email;

public class TemplateRenderResponse
{
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}