#region

using System.Text.RegularExpressions;
using MailKit.Net.Smtp;
using MailKit.Security;
using MeowShare.Api.Features.Admin.Models.Email;
using MeowShare.Api.Features.Shared.Repositories;
using MimeKit;

#endregion

namespace MeowShare.Api.Features.Admin.Services;

public partial class EmailService(
    ILogger<EmailService> logger,
    IEmailConfigRepository configRepository,
    IEmailTemplateRepository templateRepository
)
{
    public async Task<EmailTemplate?> GetTemplateByNameAsync(string name)
    {
        try
        {
            return await templateRepository.GetByNameAsync(name);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving template by name: {Name}", name);
            return null;
        }
    }

    public async Task<SendEmailResponse> SendEmailAsync(EmailOptions options)
    {
        try
        {
            var config = await configRepository.GetConfigAsync();
            if (config == null)
                return new SendEmailResponse
                {
                    Success = false,
                    Error = "Email configuration is not set up"
                };

            var message = CreateMimeMessage(options, config);
            return await SendMessageAsync(message, config);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending email");
            return new SendEmailResponse { Success = false, Error = ex.Message };
        }
    }

    public async Task<SendEmailResponse> SendWithTemplateAsync(
        string templateId,
        string[] to,
        Dictionary<string, string> data,
        Dictionary<string, string>? options = null
    )
    {
        try
        {
            var template = await templateRepository.GetByIdAsync(Guid.Parse(templateId));
            if (template == null)
                return new SendEmailResponse
                {
                    Success = false,
                    Error = $"Template with ID {templateId} not found"
                };

            var rendered = RenderTemplate(template, data);

            var emailOptions = new EmailOptions
            {
                To = to,
                Subject = rendered.Subject,
                Body = rendered.Body,
                IsHtml = template.IsHtml
            };

            // Apply additional options if provided
            if (options != null)
            {
                if (options.TryGetValue("cc", out var cc))
                    emailOptions.Cc = cc.Split(',').Select(x => x.Trim()).ToArray();

                if (options.TryGetValue("bcc", out var bcc))
                    emailOptions.Bcc = bcc.Split(',').Select(x => x.Trim()).ToArray();

                if (options.TryGetValue("replyTo", out var replyTo))
                    emailOptions.ReplyTo = replyTo;
            }

            return await SendEmailAsync(emailOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending email with template");
            return new SendEmailResponse { Success = false, Error = ex.Message };
        }
    }

    public async Task<TemplateRenderResponse> PreviewTemplateAsync(
        string templateId,
        Dictionary<string, string> data
    )
    {
        var template = await templateRepository.GetByIdAsync(Guid.Parse(templateId));
        if (template == null)
            throw new ArgumentException($"Template with ID {templateId} not found");

        return RenderTemplate(template, data);
    }

    private TemplateRenderResponse RenderTemplate(
        EmailTemplate template,
        Dictionary<string, string> data
    )
    {
        var subject = template.Subject;
        var body = template.Body;

        // Replace variables in subject and body
        foreach (var (key, value) in data)
        {
            subject = subject.Replace($"{{{{{key}}}}}", value);
            body = body.Replace($"{{{{{key}}}}}", value);
        }

        return new TemplateRenderResponse { Subject = subject, Body = body };
    }

    public async Task<bool> TestConfigAsync(EmailConfigSettings config, string testEmail)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(
                new MailboxAddress(config.SmtpFromName ?? "MeowShare", config.SmtpFromEmail)
            );
            message.To.Add(MailboxAddress.Parse(testEmail));
            message.Subject = "MeowShare Email Test";
            message.Body = new TextPart("html")
            {
                Text =
                    "<h1>Email Test</h1><p>This is a test email from MeowShare to verify your email configuration.</p>"
            };

            await SendMessageAsync(message, config);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error testing email configuration");
            return false;
        }
    }

    private MimeMessage CreateMimeMessage(EmailOptions options, EmailConfigSettings config)
    {
        var message = new MimeMessage();

        // Set From
        message.From.Add(
            new MailboxAddress(config.SmtpFromName ?? "MeowShare", config.SmtpFromEmail)
        );

        // Add To recipients
        foreach (var recipient in options.To)
            message.To.Add(MailboxAddress.Parse(recipient));

        // Add Cc if provided
        if (options.Cc != null)
            foreach (var cc in options.Cc)
                message.Cc.Add(MailboxAddress.Parse(cc));

        // Add Bcc if provided
        if (options.Bcc != null)
            foreach (var bcc in options.Bcc)
                message.Bcc.Add(MailboxAddress.Parse(bcc));

        // Set Reply-To if provided
        if (!string.IsNullOrEmpty(options.ReplyTo))
            message.ReplyTo.Add(MailboxAddress.Parse(options.ReplyTo));

        message.Subject = options.Subject;

        // Create message body
        var bodyBuilder = new BodyBuilder();
        if (options.IsHtml)
        {
            bodyBuilder.HtmlBody = options.Body;

            // Extract plain text version from HTML for clients that don't support HTML
            bodyBuilder.TextBody = ExtractTextFromHtml(options.Body);
        }
        else
        {
            bodyBuilder.TextBody = options.Body;
        }

        // Add attachments if any
        if (options.Attachments != null)
            foreach (var attachment in options.Attachments)
            {
                var bytes = Convert.FromBase64String(attachment.Content);
                bodyBuilder.Attachments.Add(
                    attachment.Filename,
                    bytes,
                    ContentType.Parse(attachment.ContentType ?? "application/octet-stream")
                );
            }

        message.Body = bodyBuilder.ToMessageBody();
        return message;
    }

    private async Task<SendEmailResponse> SendMessageAsync(
        MimeMessage message,
        EmailConfigSettings config
    )
    {
        using var client = new SmtpClient();

        try
        {
            // Determine secure socket options based on port and EnableSsl setting
            var secureSocketOptions = config.SmtpPort switch
            {
                465 => SecureSocketOptions.SslOnConnect, // Always use SSL for port 465
                587 => SecureSocketOptions.StartTls, // Always use STARTTLS for port 587
                _ => config.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None
            };

            await client.ConnectAsync(config.SmtpHost, config.SmtpPort, secureSocketOptions);

            if (
                !string.IsNullOrEmpty(config.SmtpUser) && !string.IsNullOrEmpty(config.SmtpPassword)
            )
                await client.AuthenticateAsync(config.SmtpUser, config.SmtpPassword);

            var response = await client.SendAsync(message);
            await client.DisconnectAsync(true);

            return new SendEmailResponse { Success = true, MessageId = message.MessageId };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email");

            if (ex.InnerException != null)
                logger.LogError(
                    "Inner exception: {Type}: {Message}",
                    ex.InnerException.GetType().Name,
                    ex.InnerException.Message
                );

            return new SendEmailResponse { Success = false, Error = ex.Message };
        }
    }

    private string ExtractTextFromHtml(string html)
    {
        // Remove HTML tags
        var text = Regex.Replace(html, "<[^>]*>", string.Empty);

        // Replace common HTML entities
        text = text.Replace("&nbsp;", " ")
            .Replace("&amp;", "&")
            .Replace("&lt;", "<")
            .Replace("&gt;", ">")
            .Replace("&quot;", "\"")
            .Replace("&#39;", "'");

        // Normalize whitespace
        text = MyRegex().Replace(text, " ");

        return text.Trim();
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex MyRegex();
}