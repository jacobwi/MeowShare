namespace MeowShare.Api.Features.Admin.Models;

public class BatchOperationRequest
{
    public IEnumerable<Guid> FileIds { get; set; } = new List<Guid>();
    public string Operation { get; set; } = string.Empty;
}