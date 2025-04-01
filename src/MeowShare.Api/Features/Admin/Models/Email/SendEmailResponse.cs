namespace MeowShare.Api.Features.Admin.Models.Email;

public class SendEmailResponse
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string? Error { get; set; }
}