#region

using System.Security.Claims;
using MeowShare.Api.Features.Admin.Models.Email;
using MeowShare.Api.Features.Admin.Services;
using MeowShare.Api.Features.Shared.Repositories;
using Microsoft.AspNetCore.Mvc;

#endregion

namespace MeowShare.Api.Features.Admin;

public static class EmailEndpoints
{
    public static IEndpointRouteBuilder MapEmailEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/email")
            .WithTags("Email");

        // Send email
        group.MapPost("/send", async (
            [FromBody] EmailOptions options,
            EmailService emailService,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var result = await emailService.SendEmailAsync(options);
            return Results.Ok(result);
        });

        // Send file share notification
        group.MapPost("/share-notification", async (
            [FromBody] ShareNotificationRequest request,
            EmailService emailService,
            IFileShareRepository fileRepo,
            HttpContext httpContext) =>
        {
            var file = await fileRepo.GetByIdAsync(Guid.Parse(request.FileId));
            if (file == null) return Results.NotFound("File not found");

            var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check if user owns the file or is an admin
            var userGuid = Guid.TryParse(userId, out var parsedUserId) ? parsedUserId : Guid.Empty;
            if (file.UserId != userGuid && !httpContext.User.IsInRole("Admin")) return Results.Forbid();

            // Try to get a template by name first
            var template = await emailService.GetTemplateByNameAsync("file-share");

            if (template == null)
            {
                // Create default data
                var fileUrl = !string.IsNullOrEmpty(file.CustomUrl)
                    ? $"/share/{file.CustomUrl}"
                    : $"/share/{file.Id}";

                var data = new Dictionary<string, string>
                {
                    { "fileName", file.FileName },
                    { "fileUrl", fileUrl },
                    { "message", request.Message ?? "A file has been shared with you." },
                    { "senderName", httpContext.User.Identity?.Name ?? "A user" }
                };

                // Create default email options without using a template
                var options = new EmailOptions
                {
                    To = request.Recipients,
                    Subject = $"File shared with you: {file.FileName}",
                    Body = $@"<html><body>
                        <h2>File shared with you</h2>
                        <p>{data["senderName"]} has shared a file with you: <strong>{data["fileName"]}</strong></p>
                        <p>{data["message"]}</p>
                        <p><a href='{data["fileUrl"]}'>Click here to download the file</a></p>
                        <p>This is an automated message from MeowShare.</p>
                        </body></html>",
                    IsHtml = true
                };

                var result = await emailService.SendEmailAsync(options);
                return Results.Ok(result);
            }
            else
            {
                // We found a template, use it
                var fileUrl = !string.IsNullOrEmpty(file.CustomUrl)
                    ? $"/share/{file.CustomUrl}"
                    : $"/share/{file.Id}";

                var data = new Dictionary<string, string>
                {
                    { "fileName", file.FileName },
                    { "fileUrl", fileUrl },
                    { "message", request.Message ?? "A file has been shared with you." },
                    { "senderName", httpContext.User.Identity?.Name ?? "A user" }
                };

                var result = await emailService.SendWithTemplateAsync(
                    template.Id.ToString(),
                    request.Recipients,
                    data);

                return Results.Ok(result);
            }
        });

        // Send with template
        group.MapPost("/send-template", async (
            [FromBody] TemplateEmailRequest request,
            EmailService emailService,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var options = request.Options != null
                ? new Dictionary<string, string>(request.Options)
                : null;

            var result = await emailService.SendWithTemplateAsync(
                request.TemplateId,
                request.To,
                request.Data,
                options);

            return Results.Ok(result);
        });

        // Get email templates
        group.MapGet("/templates", async (
            IEmailTemplateRepository templateRepo,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var templates = await templateRepo.GetAllAsync();
            return Results.Ok(templates);
        });

        // Get template by ID
        group.MapGet("/templates/{id}", async (
            string id,
            IEmailTemplateRepository templateRepo,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var template = await templateRepo.GetByIdAsync(Guid.Parse(id));
            if (template == null) return Results.NotFound();

            return Results.Ok(template);
        });

        // Preview template
        group.MapPost("/templates/{id}/preview", async (
            string id,
            [FromBody] TemplatePreviewRequest request,
            EmailService emailService,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            try
            {
                var result = await emailService.PreviewTemplateAsync(id, request.Data);
                return Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.NotFound(ex.Message);
            }
        });

        // Get email configuration
        group.MapGet("/config", async (
            IEmailConfigRepository configRepo,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var config = await configRepo.GetConfigAsync();
            // Don't return the password
            if (config != null) config.SmtpPassword = null;

            return Results.Ok(config);
        });

        // Update email configuration
        group.MapPut("/config", async (
            [FromBody] EmailConfigSettings config,
            IEmailConfigRepository configRepo,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var existingConfig = await configRepo.GetConfigAsync();

            // If password is empty, keep the existing one
            if (string.IsNullOrEmpty(config.SmtpPassword) && existingConfig != null)
                config.SmtpPassword = existingConfig.SmtpPassword;

            var success = await configRepo.SaveConfigAsync(config);
            return success ? Results.Ok(new { success = true }) : Results.BadRequest(new { success = false });
        });

        // Test email configuration
        group.MapPost("/test-config", async (
            [FromBody] TestConfigRequest request,
            EmailService emailService,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var success = await emailService.TestConfigAsync(request.Config, request.TestEmail);
            return Results.Ok(new
            {
                success,
                message = success
                    ? "Test email sent successfully. Please check your inbox."
                    : "Failed to send test email. Please check the configuration."
            });
        });

        // Create email template
        group.MapPost("/templates", async (
            [FromBody] EmailTemplate template,
            IEmailTemplateRepository templateRepo,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            template.CreatedBy = userId;

            var result = await templateRepo.CreateAsync(template);
            return Results.Created($"/api/email/templates/{result.Id}", result);
        });

        // Update email template
        group.MapPut("/templates/{id}", async (
            string id,
            [FromBody] EmailTemplate template,
            IEmailTemplateRepository templateRepo,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            if (template.Id != Guid.Parse(id)) return Results.BadRequest("Template ID mismatch");

            var success = await templateRepo.UpdateAsync(template);
            return success ? Results.Ok(template) : Results.NotFound();
        });

        // Delete email template
        group.MapDelete("/templates/{id}", async (
            string id,
            IEmailTemplateRepository templateRepo,
            HttpContext httpContext) =>
        {
            if (!httpContext.User.IsInRole("Admin")) return Results.Forbid();

            var success = await templateRepo.DeleteAsync(Guid.Parse(id));
            return success ? Results.Ok(new { success = true }) : Results.NotFound();
        });

        return app;
    }
}

// Request models
public class ShareNotificationRequest
{
    public string FileId { get; set; } = string.Empty;
    public string[] Recipients { get; set; } = Array.Empty<string>();
    public string? Message { get; set; }
}

public class TemplateEmailRequest
{
    public string TemplateId { get; set; } = string.Empty;
    public string[] To { get; set; } = Array.Empty<string>();
    public Dictionary<string, string> Data { get; set; } = new();
    public Dictionary<string, string>? Options { get; set; }
}

public class TemplatePreviewRequest
{
    public Dictionary<string, string> Data { get; set; } = new();
}

public class TestConfigRequest
{
    public EmailConfigSettings Config { get; set; } = new();
    public string TestEmail { get; set; } = string.Empty;
}