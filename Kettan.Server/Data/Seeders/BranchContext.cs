using Kettan.Server.Entities;

namespace Kettan.Server.Data.Seeders;

public sealed class BranchContext
{
    public required Branch Hq { get; init; }
    public required Branch Main { get; init; }
}
