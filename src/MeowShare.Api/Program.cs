#region

using MeowShare.Api.Auth;
using MeowShare.Api.Data;
using MeowShare.Api.Features.Admin;
using MeowShare.Api.Features.Admin.Services;
using MeowShare.Api.Features.FileSharing;
using MeowShare.Api.Features.FileSharing.Services;
using MeowShare.Api.Features.Shared.Repositories;
using Moka.Auth.Core.Extensions;
using Moka.Auth.Data.Extensions;
using Scalar.AspNetCore;

#endregion

var builder = WebApplication.CreateBuilder(args);

// Add environment variables
//builder.Configuration.AddEnvironmentVariables();

// Add services to the container
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();

// Add MeowShare.Api authentication
builder.Services.AddAuth(builder.Configuration);

// Add Repositories
builder.Services.AddScoped<IFileShareRepository, FileShareRepository>();
builder.Services.AddScoped<IEmailTemplateRepository, EmailTemplateRepository>();
builder.Services.AddScoped<IEmailConfigRepository, EmailConfigRepository>();

// Add Services
builder.Services.AddScoped<ChunkedUploadService>();
builder.Services.AddScoped<EmailService>();

// API Documentation and Versioning
builder.Services.AddEndpointsApiExplorer();

// Cors
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        var corsSettings = builder.Configuration.GetSection("Cors");
        var origins = corsSettings.GetSection("AllowedOrigins").Get<string[]>();

        var corsPolicy = policy.WithOrigins(origins ?? ["http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod();

        if (corsSettings.GetValue<bool>("AllowCredentials"))
            corsPolicy.AllowCredentials();
        else
            corsPolicy.DisallowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference("/api-reference",
        options => { options.AddServer(new ScalarServer("https://localhost:7222", "Development")); });
}

app.UseHttpsRedirection();

// Use CORS
app.UseCors("ReactAppPolicy");

// Configure Moka Auth in correct order
app.UseMokaAuthDatabase<AppDbContext>();
app.UseMokaAuth(builder.Configuration);
await app.UseMeowAuthSeeder();

// Moka IAM endpoints
app.MapMokaDefaultEndpoints(options =>
{
    options.EnableAuthEndpoints = true;
    options.EnableUserEndpoints = true;
    options.EnableRoleEndpoints = true;
    options.EnablePermissionEndpoints = false;
    options.EnableApiKeyEndpoints = false;
    options.EnableImpersonationEndpoints = true;
});

// Map File Sharing Endpoints
app.MapFileSharingEndpoints();

// Map Admin Endpoints
app.MapAdminEndpoints();

// Map Email Endpoints
app.MapEmailEndpoints();

await app.RunAsync();