using Microsoft.AspNetCore.SignalR;

namespace Kettan.Server.Hubs
{
    public class ReturnHub : Hub
    {
        // Generic Join/Leave for shared components
        public async Task JoinGroup(string groupName) => await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        public async Task LeaveGroup(string groupName) => await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        public async Task JoinReturn(int returnId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Return_{returnId}");
        }

        public async Task LeaveReturn(int returnId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Return_{returnId}");
        }

        public async Task JoinReturnsList()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Returns_All");
        }

        public async Task LeaveReturnsList()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Returns_All");
        }
    }
}
