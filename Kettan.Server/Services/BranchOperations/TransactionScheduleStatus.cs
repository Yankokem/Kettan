namespace Kettan.Server.Services.BranchOperations;

public static class TransactionScheduleStatus
{
    public const string NoSchedule = "NoSchedule";
    public const string Scheduled = "Scheduled";
    public const string DueToday = "DueToday";
    public const string OnTime = "OnTime";
    public const string Late = "Late";

    public static string Resolve(DateTime? scheduledAt, DateTime? actualAt, DateTime? nowUtc = null)
    {
        if (!scheduledAt.HasValue)
        {
            return NoSchedule;
        }

        var scheduledDate = scheduledAt.Value.Date;

        if (actualAt.HasValue)
        {
            return actualAt.Value.Date <= scheduledDate ? OnTime : Late;
        }

        var today = (nowUtc ?? DateTime.UtcNow).Date;
        if (today < scheduledDate)
        {
            return Scheduled;
        }

        return today == scheduledDate ? DueToday : Late;
    }
}
