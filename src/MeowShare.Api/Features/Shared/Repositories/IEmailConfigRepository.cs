#region

using MeowShare.Api.Features.Admin.Models.Email;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public interface IEmailConfigRepository
{
    Task<EmailConfigSettings?> GetConfigAsync();
    Task<bool> SaveConfigAsync(EmailConfigSettings config);
}