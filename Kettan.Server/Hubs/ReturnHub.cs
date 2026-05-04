using Microsoft.AspNetCore.SignalR;

namespace Kettan.Server.Hubs
{
    public class ReturnHub : Hub
    {
        public async Task JoinReturnGroup(int returnId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Return_{returnId}");
        }

        public async Task LeaveReturnGroup(int returnId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Return_{returnId}");
        }
    }
}
