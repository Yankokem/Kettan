namespace Kettan.Server.Entities;

public class DocumentSequence
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string PeriodKey { get; set; } = string.Empty;
    public int LastValue { get; set; }
}
