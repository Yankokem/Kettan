using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Entities;

namespace Kettan.Server.Services;

public class DocumentSequenceService : IDocumentSequenceService
{
    private readonly ApplicationDbContext _context;

    public DocumentSequenceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateNextCodeAsync(int tenantId, string documentType, string prefix)
    {
        var periodKey = DateTime.UtcNow.ToString("yyMM"); // YYMM

        // Using a transaction to ensure atomic increment pattern if not already in one, 
        // though typically EF core should handle this within its own SaveChanges.
        // For robustness against concurrency, we can use an explicit transaction or just optimistic concurrency.
        // We will perform a simple check then add/update, with a retry if conflict.

        const int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                var sequence = await _context.DocumentSequences
                    .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.DocumentType == documentType && s.PeriodKey == periodKey);

                if (sequence == null)
                {
                    sequence = new DocumentSequence
                    {
                        TenantId = tenantId,
                        DocumentType = documentType,
                        PeriodKey = periodKey,
                        LastValue = 1
                    };
                    _context.DocumentSequences.Add(sequence);
                }
                else
                {
                    sequence.LastValue++;
                    _context.DocumentSequences.Update(sequence);
                }

                await _context.SaveChangesAsync();

                // Format: {PREFIX}-{YYMM}-{4-digit seq}
                return $"{prefix}-{periodKey}-{sequence.LastValue:D4}";
            }
            catch (DbUpdateException)
            {
                // Concurrency issue or unique constraint violation (if two threads try to insert the first row simultaneously)
                if (i == maxRetries - 1)
                    throw; // Rethrow on last attempt
                
                // Clear the state manager so we can fetch afresh
                _context.ChangeTracker.Clear();
                await Task.Delay(Random.Shared.Next(50, 150)); // backoff
            }
        }

        throw new Exception("Failed to generate document sequence after maximum retries.");
    }
}
