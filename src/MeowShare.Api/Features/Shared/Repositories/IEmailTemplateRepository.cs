#region

using MeowShare.Api.Features.Admin.Models.Email;

#endregion

namespace MeowShare.Api.Features.Shared.Repositories;

public interface IEmailTemplateRepository
{
    Task<EmailTemplate?> GetByIdAsync(Guid id);
    Task<EmailTemplate?> GetByNameAsync(string name);
    Task<IEnumerable<EmailTemplate>> GetAllAsync();
    Task<EmailTemplate> CreateAsync(EmailTemplate template);
    Task<bool> UpdateAsync(EmailTemplate template);
    Task<bool> DeleteAsync(Guid id);
}