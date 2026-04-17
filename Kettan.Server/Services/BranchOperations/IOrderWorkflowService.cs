using Kettan.Server.DTOs.Orders;

namespace Kettan.Server.Services.BranchOperations;

public interface IOrderWorkflowService
{
    Task<List<BranchOrderDto>> ListBranchOrdersAsync(string? status = null);
    Task<List<OrderStatusHistoryDto>> GetOrderHistoryAsync(int orderId);
    Task<bool> ConfirmDeliveryAsync(int orderId, ConfirmDeliveryDto dto);
}
