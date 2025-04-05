#region

using MeowShare.Api.Data;
using MeowShare.Api.Features.Profile.Models;
using Moka.Auth.Core.Entities;
using Moka.Auth.Core.Features.Auth;
using Moka.Auth.Data;
using Moka.Auth.Data.Extensions;
using Moka.Auth.Data.Seeding;
using Moka.Auth.Data.Seeding.Configuration;

#endregion

namespace MeowShare.Api.Auth;

public static class MeowAuthExtensions
{
    /// <summary>
    /// Adds MeowShare.Api authentication and authorization using MokaAuth
    /// </summary>
    public static IServiceCollection AddAuth(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        // Get connection string
        var connectionString =
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string is required");

        // Use the generic version with AppDbContext
        services.AddMokaAuthDbContext<ApplicationUser, MokaRole, AppDbContext>(
            dbOptions =>
            {
                dbOptions.ConnectionString = connectionString;
                dbOptions.DbType = DbType.SQLite;
                dbOptions.EnableSensitiveDataLogging = true;
            },
            authOptions =>
            {
                authOptions.EnableIdentitySystem = true;
                authOptions.EnableImpersonation = true;
                // Other auth options as needed
            }
        );

        // Add Moka.Auth with configuration from appsettings.json
        services.AddMokaAuth<AppDbContext, ApplicationUser>();

        // Add Authorization with MokaAuth
        services.AddMokaAuthorization();

        return services;
    }

    /// <summary>
    /// Seeds initial data for MeowShare.Api
    /// </summary>
    public static async Task<IApplicationBuilder> UseMeowAuthSeeder(this WebApplication app)
    {
        var configuration = app.Services.GetRequiredService<IConfiguration>();
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        var demoMode = configuration["DEMO_MODE"] == "true";

        logger.LogInformation("DEMO_MODE environment variable: {DemoModeVariable}", configuration["DEMO_MODE"]);
        logger.LogInformation("Demo mode enabled: {DemoMode}", demoMode);

        // Print boxed message about demo mode
        PrintBoxedMessage(demoMode);

        if (demoMode)
        {
            var yamlFilePath = Path.Combine(app.Environment.ContentRootPath, "seed-data.yaml");
            logger.LogInformation("Looking for seed data file at: {YamlFilePath}", yamlFilePath);
            logger.LogDebug("ContentRootPath: {ContentRootPath}", app.Environment.ContentRootPath);

            if (File.Exists(yamlFilePath))
            {
                logger.LogInformation("Found seed data file at: {YamlFilePath}", yamlFilePath);
                try
                {
                    var yamlContent = await File.ReadAllTextAsync(yamlFilePath);
                    logger.LogDebug("YAML file content length: {ContentLength} bytes", yamlContent.Length);

                    await app.SeedMokaAuthDataFromYamlAsync<ApplicationUser, MokaRole, AppDbContext>(
                        yamlFilePath
                    );
                    logger.LogInformation("Successfully seeded data from YAML file");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error seeding data from YAML");
                }
            }
            else
            {
                logger.LogWarning("Seed data file not found at: {YamlFilePath}", yamlFilePath);
                logger.LogDebug("Directory contents:");
                try
                {
                    var files = Directory.GetFiles(app.Environment.ContentRootPath);
                    foreach (var file in files)
                        logger.LogDebug("- {FileName}", file);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error listing directory");
                }

                // Fallback to default admin user if YAML file is missing
                logger.LogInformation("Falling back to default admin user");
                try
                {
                    await app.SeedMokaAuthDataAsync<ApplicationUser, MokaRole, AppDbContext>(
                        new MokaAuthSeederOptions
                        {
                            Users =
                            [
                                new UserSeedConfiguration()
                                {
                                    Username = "admin",
                                    Email = "admin@example.com",
                                    Password = "Admin123!",
                                    FirstName = "System",
                                    LastName = "Administrator",
                                    IsActive = true,
                                    EmailConfirmed = true,
                                    Roles = ["Admin"],
                                    ApiKeys = ["AdminApiKey"]
                                }
                            ]
                        }
                    );
                    logger.LogInformation("Successfully seeded default admin user");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error seeding default admin user");
                }
            }
        }
        else
        {
            var adminPassword = configuration["ADMIN_PASSWORD"] ?? GenerateSecurePassword();
            var adminEmail = configuration["ADMIN_EMAIL"] ?? "admin@meow.local";

            try
            {
                await app.SeedMokaAuthDataAsync<ApplicationUser, MokaRole, AppDbContext>(
                    new MokaAuthSeederOptions
                    {
                        Users =
                        [
                            new UserSeedConfiguration()
                            {
                                Username = "admin",
                                Email = adminEmail,
                                Password = adminPassword,
                                FirstName = "System",
                                LastName = "Administrator",
                                IsActive = true,
                                EmailConfirmed = true,
                                Roles = ["Admin"],
                                ApiKeys = ["AdminApiKey"]
                            }
                        ]
                    }
                );
                logger.LogInformation("Successfully seeded production admin user");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error seeding production admin user");
            }

            // Print the admin credentials in production mode
            if (string.IsNullOrEmpty(configuration["ADMIN_PASSWORD"]))
                PrintAdminCredentials("admin", adminEmail, adminPassword);
        }

        return app;
    }

    #region Private Methods

    private static void PrintBoxedMessage(bool demoMode)
    {
        var mode = demoMode ? "DEMO MODE" : "PRODUCTION MODE";
        var title = $" MEOWSHARE RUNNING IN {mode} ";
        var borderColor = demoMode ? ConsoleColor.Yellow : ConsoleColor.Green;
        var highlightColor = demoMode ? ConsoleColor.Yellow : ConsoleColor.Cyan;

        var content = new List<(string, ConsoleColor?, bool)>();

        if (demoMode)
        {
            // Make demo mode more prominent
            content.Add(("", null, false)); // Empty line for spacing
            content.Add(("⚠️  THIS IS DEMO MODE - NOT FOR PRODUCTION USE  ⚠️", ConsoleColor.Red, true));
            content.Add(("", null, false)); // Empty line for spacing
            content.Add(("Demo Credentials:", null, false));
            content.Add(("Username: admin@example.com", highlightColor, false));
            content.Add(("Password: Admin123!", highlightColor, false));
            content.Add(("", null, false)); // Empty line
            content.Add(("WARNING: All data will be reset on application restart", null, true));
            content.Add(("WARNING: Do not use in production environment!", null, true));
        }

        PrintColorBox(
            title,
            content,
            '=',
            borderColor,
            ConsoleColor.White,
            ConsoleColor.White,
            highlightColor,
            ConsoleColor.Red
        );
    }

    private static void PrintAdminCredentials(string username, string email, string password)
    {
        var title = " ADMIN CREDENTIALS - SAVE THESE ";
        var content = new List<(string, ConsoleColor?, bool)>
        {
            ($"Username: {username}", ConsoleColor.Yellow, false),
            ($"Email:    {email}", ConsoleColor.Yellow, false),
            ($"Password: {password}", ConsoleColor.Yellow, false)
        };

        PrintColorBox(
            title,
            content,
            '*',
            ConsoleColor.Cyan,
            ConsoleColor.White,
            ConsoleColor.White,
            ConsoleColor.Yellow
        );
    }

    private static string GenerateSecurePassword()
    {
        // Generate a cryptographically secure password
        const string chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        var random = new Random();
        return new string(
            Enumerable.Repeat(chars, 16).Select(s => s[random.Next(s.Length)]).ToArray()
        );
    }

    /// <summary>
    /// Prints a colorful box with the specified content and configuration.
    /// </summary>
    /// <param name="title">Box title to display centered at the top</param>
    /// <param name="content">Lines of content to display in the box</param>
    /// <param name="borderChar">Character to use for the border (default: '=')</param>
    /// <param name="borderColor">Color for the border</param>
    /// <param name="titleColor">Color for the title</param>
    /// <param name="contentColor">Color for normal content</param>
    /// <param name="highlightColor">Color for highlighted content</param>
    /// <param name="warningColor">Color for warnings</param>
    /// <param name="minWidth">Minimum width of the box (default: 50)</param>
    private static void PrintColorBox(
        string title,
        IEnumerable<(string Text, ConsoleColor? Color, bool IsWarning)> content,
        char borderChar = '=',
        ConsoleColor borderColor = ConsoleColor.Cyan,
        ConsoleColor titleColor = ConsoleColor.White,
        ConsoleColor contentColor = ConsoleColor.White,
        ConsoleColor highlightColor = ConsoleColor.Yellow,
        ConsoleColor warningColor = ConsoleColor.Red,
        int minWidth = 50)
    {
        // Gather all content lines
        var contentLines = content.ToList();

        // Calculate box width based on longest content
        var titleWidth = title.Length;
        var contentWidth = contentLines.Any()
            ? contentLines.Max(line => line.Text.Length)
            : 0;

        // Ensure minimum width
        var boxContentWidth = Math.Max(Math.Max(titleWidth, contentWidth) + 4, minWidth);
        var boxWidth = boxContentWidth + 2; // +2 for side borders

        // Prepare border and empty lines
        var topBottomBorder = "+" + new string(borderChar, boxWidth - 2) + "+";
        var emptyLine = "|" + new string(' ', boxWidth - 2) + "|";

        // Print top of box
        Console.ForegroundColor = borderColor;
        Console.WriteLine(topBottomBorder);
        Console.WriteLine(emptyLine);

        // Print title
        var centeredTitle = title.PadLeft((boxWidth - 2 + title.Length) / 2).PadRight(boxWidth - 2);
        Console.Write("|");
        Console.ForegroundColor = titleColor;
        Console.Write(centeredTitle);
        Console.ForegroundColor = borderColor;
        Console.WriteLine("|");

        // Print empty line after title
        Console.WriteLine(emptyLine);

        // Print content
        foreach (var line in contentLines)
        {
            Console.ForegroundColor = borderColor;
            Console.Write("| ");

            // Use specified color or default content color
            Console.ForegroundColor = line.IsWarning ? warningColor : line.Color ?? contentColor;

            // Write the content with appropriate padding
            Console.Write(line.Text.PadRight(boxWidth - 4));

            Console.ForegroundColor = borderColor;
            Console.WriteLine(" |");
        }

        // Print bottom of box
        Console.ForegroundColor = borderColor;
        Console.WriteLine(emptyLine);
        Console.WriteLine(topBottomBorder);
        Console.ResetColor();
    }

    #endregion
}