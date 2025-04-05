#region

using dotenv.net;
using MeowShare.Api.Auth;
using MeowShare.Api.Data;
using MeowShare.Api.Features.Admin;
using MeowShare.Api.Features.Admin.Services;
using MeowShare.Api.Features.FileSharing;
using MeowShare.Api.Features.FileSharing.Services;
using MeowShare.Api.Features.Profile;
using MeowShare.Api.Features.Profile.Models;
using MeowShare.Api.Features.Profile.Services;
using MeowShare.Api.Features.Shared.Repositories;
using Moka.Auth.Core.Extensions;
using Moka.Auth.Core.Features.Auth;
using Moka.Auth.Data.Extensions;
using Scalar.AspNetCore;

#endregion

DotEnv.Load(new DotEnvOptions(envFilePaths: ["../../.env"]));


var builder = WebApplication.CreateBuilder(args);

// Add environment variables
builder.Configuration.AddEnvironmentVariables();

// Add services to the container
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();

// Add MeowShare.Api authentication
builder.Services.AddAuth(builder.Configuration);

// Add Repositories
builder.Services.AddScoped<IFileShareRepository, FileShareRepository>();
builder.Services.AddScoped<IEmailTemplateRepository, EmailTemplateRepository>();
builder.Services.AddScoped<IEmailConfigRepository, EmailConfigRepository>();
builder.Services.AddScoped<IApplicationUserRepository, ApplicationUserRepository>();

// Add Services
builder.Services.AddScoped<ChunkedUploadService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<IAvatarService, AvatarService>();

// API Documentation and Versioning
builder.Services.AddEndpointsApiExplorer();

// Cors
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "ReactAppPolicy",
        policy =>
        {
            var corsSettings = builder.Configuration.GetSection("Cors");
            var origins = corsSettings.GetSection("AllowedOrigins").Get<string[]>();

            var corsPolicy = policy
                .WithOrigins(origins ?? ["http://localhost:3000"])
                .AllowAnyHeader()
                .AllowAnyMethod();

            if (corsSettings.GetValue<bool>("AllowCredentials"))
                corsPolicy.AllowCredentials();
            else
                corsPolicy.DisallowCredentials();
        }
    );
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(
        "/api-reference",
        options => { options.AddServer(new ScalarServer("https://localhost:7222", "Development")); }
    );
}

app.UseHttpsRedirection();

// Use CORS
app.UseCors("ReactAppPolicy");

// // Use static files
// app.UseStaticFiles();

// Configure Moka Auth in correct order
app.UseMokaAuthDatabase<AppDbContext>();
app.UseMokaAuth(builder.Configuration);

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Console.WriteLine("Ensuring database is created...");
        db.Database.EnsureCreated();
        Console.WriteLine("Database created successfully");

        // Verify database connection
        var canConnect = await db.Database.CanConnectAsync();
        Console.WriteLine($"Database connection test: {(canConnect ? "Success" : "Failed")}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error during database initialization: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

// Seed the database
Console.WriteLine("Starting database seeding...");
await app.UseMeowAuthSeeder();
Console.WriteLine("Database seeding completed");

// Moka IAM endpoints
app.MapMokaDefaultEndpoints<ApplicationUser>(options =>
{
    options.EnableAuthEndpoints = true;
    options.EnableUserEndpoints = true;
    options.EnableRoleEndpoints = true;
    options.EnablePermissionEndpoints = false;
    options.EnableApiKeyEndpoints = false;
    options.EnableImpersonationEndpoints = true;
});

// Map Profile Endpoints
app.MapProfileEndpoints();

// Map File Sharing Endpoints
app.MapFileSharingEndpoints();

// Map Admin Endpoints
app.MapAdminEndpoints();

// Map Email Endpoints
app.MapEmailEndpoints();

await app.RunAsync();