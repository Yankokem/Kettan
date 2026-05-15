namespace Kettan.Server.Enums;

public enum RequestType : byte
{
    Regular = 0,
    Manual = 0,         // Alias for Regular
    Emergency = 1,
    Scheduled = 2,
    Replenishment = 3,
    EventLoadout = 4,
    NewBranchSetup = 5,
    Auto = 6,
    Replacement = 7,
    HqInitiated = 8
}
