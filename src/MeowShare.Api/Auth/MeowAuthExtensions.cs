#region

using MeowShare.Api.Data;
using Moka.Auth.Core.Extensions;
using Moka.Auth.Core.Options;
using Moka.Auth.Data.Context;
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
        services.AddMokaAuthDbContext<AppDbContext>(
            dbOptions =>
            {
                dbOptions.ConnectionString = connectionString;
                dbOptions.DbType = DbType.SQLite;
                dbOptions.EnableSensitiveDataLogging = true;
            },
            authOptions =>
            {
                authOptions.EnableIdentitySystem = true;
                // Other auth options as needed
            }
        );
        services.AddScoped<MokaAuthDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        // Add Moka.Auth with configuration from appsettings.json
        services.AddMokaAuth();

        // Add Authorization with MokaAuth
        services.AddMokaAuthorization();

        return services;
    }

    /// <summary>
    /// Seeds initial data for MeowShare.Api
    /// </summary>
    public static async Task<IApplicationBuilder> UseMeowAuthSeeder(this WebApplication app)
    {
        var demoMode = Environment.GetEnvironmentVariable("DEMO_MODE") == "true";

        // Print boxed message about demo mode
        PrintBoxedMessage(demoMode);

        if (demoMode)
        {
            var yamlFilePath = Path.Combine(app.Environment.ContentRootPath, "seed-data.yaml");
            if (File.Exists(yamlFilePath)) await app.SeedMokaAuthDataFromYamlAsync(yamlFilePath);
        }
        else
        {
            var adminPassword =
                Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? GenerateSecurePassword();
            var adminEmail =
                Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@meow.local";

            await app.SeedMokaAuthDataAsync(
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

            // Print the admin credentials in production mode
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ADMIN_PASSWORD")))
                PrintAdminCredentials("admin", adminEmail, adminPassword);
        }

        return app;
    }

    #region Private Methods

    private static void PrintAdminCredentials(string username, string email, string password)
    {
        var headerText = " ADMIN CREDENTIALS - SAVE THESE ";
        var lineLength = Math.Max(Math.Max(email.Length, password.Length) + 15, 50);
        var topBottomBorder = new string('*', lineLength);
        var emptyLine = $"*{new string(' ', lineLength - 2)}*";

        Console.ForegroundColor = ConsoleColor.Cyan;

        Console.WriteLine(topBottomBorder);
        Console.WriteLine(emptyLine);
        Console.WriteLine($"*{headerText.PadRight(lineLength - 2)}*");
        Console.WriteLine(emptyLine);
        Console.WriteLine($"* Username: {username.PadRight(lineLength - 13)}*");
        Console.WriteLine($"* Email:    {email.PadRight(lineLength - 11)}*");
        Console.WriteLine($"* Password: {password.PadRight(lineLength - 13)}*");
        Console.WriteLine(emptyLine);
        Console.WriteLine(topBottomBorder);

        Console.ResetColor();
    }

    private static void PrintBoxedMessage(bool demoMode)
    {
        var mode = demoMode ? "DEMO MODE" : "PRODUCTION MODE";
        var headerText = $" MEOWSHARE RUNNING IN {mode} ";

        var lineLength = Math.Max(headerText.Length + 2, 50);
        var topBottomBorder = new string('=', lineLength);
        var emptyLine = $"|{new string(' ', lineLength - 2)}|";

        Console.ForegroundColor = demoMode ? ConsoleColor.Yellow : ConsoleColor.Green;

        Console.WriteLine(topBottomBorder);
        Console.WriteLine(emptyLine);
        Console.WriteLine($"|{headerText.PadRight(lineLength - 2)}|");
        Console.WriteLine(emptyLine);

        if (demoMode)
        {
            Console.WriteLine($"| Demo Credentials:                              |");
            Console.WriteLine($"| Username: admin@example.com                    |");
            Console.WriteLine($"| Password: Admin123!                            |");
            Console.WriteLine(emptyLine);
            Console.WriteLine($"| WARNING: Do not use in production!             |");
        }

        Console.WriteLine(topBottomBorder);
        Console.ResetColor();
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

    #endregion
}