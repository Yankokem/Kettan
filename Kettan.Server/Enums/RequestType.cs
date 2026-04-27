namespace Kettan.Server.Enums;

public enum RequestType : byte
{
    Regular = 0,
    Manual = 0,         // Alias for Regular
    Emergency = 1,
    Scheduled = 2,
    HqInitiated = 2,    // Alias for Scheduled
    Auto = 2,           // Alias for Scheduled
    Replacement = 2     // Alias for Scheduled
}
