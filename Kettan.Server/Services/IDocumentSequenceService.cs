namespace Kettan.Server.Services;

public interface IDocumentSequenceService
{
    Task<string> GenerateNextCodeAsync(int tenantId, string documentType, string prefix);
}
