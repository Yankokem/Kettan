namespace Kettan.Server.Enums;

public enum ReturnStatus : byte
{
    Draft = 0,
    Submitted = 1,
    Acknowledged = 2,
    Dispatched = 3,
    Arrived = 4,
    Inspecting = 5,
    Completed = 6,
    Rejected = 7
}
