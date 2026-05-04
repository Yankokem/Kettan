using Microsoft.AspNetCore.SignalR;

namespace Kettan.Server.Hubs
{
    public class WorkflowHub : Hub
    {
        // Generic Join
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        // Generic Leave
        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        // Specific shortcuts
        public async Task JoinOrder(int orderId) => await JoinGroup($"Order_{orderId}");
        public async Task JoinSupplyRequest(int requestId) => await JoinGroup($"SupplyRequest_{requestId}");
        public async Task JoinReturn(int returnId) => await JoinGroup($"Return_{returnId}");
        
        public async Task JoinOrdersList() => await JoinGroup("Orders_All");
        public async Task JoinSupplyRequestsList() => await JoinGroup("SupplyRequests_All");
        public async Task JoinReturnsList() => await JoinGroup("Returns_All");
    }
}
