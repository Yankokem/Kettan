using Kettan.Server.DTOs.Orders;

namespace Kettan.Server.Services.BranchOperations;

public interface IOrderWorkflowService
{
    Task<List<BranchOrderDto>> ListBranchOrdersAsync(string? status = null, int? branchId = null);
    Task<OrderDetailDto> CreateHqOrderAsync(CreateOrderDto dto);
    Task<OrderDetailDto?> GetOrderDetailAsync(int orderId);
    Task<List<OrderStatusHistoryDto>> GetOrderHistoryAsync(int orderId);
    Task<bool> StartPickingAsync(int orderId, UpdateOrderStatusDto dto);
    Task<bool> ConfirmPackedAsync(int orderId, UpdateOrderStatusDto dto);
    Task<bool> DispatchAsync(int orderId, DispatchOrderDto dto);
    Task<bool> ConfirmDeliveryAsync(int orderId, ConfirmDeliveryDto dto);
    Task<List<PickingSuggestionDto>> GetPickingSuggestionsAsync(int orderId);
    Task<OrderDetailDto?> SavePickingAsync(int orderId, PickingSubmitDto dto);
    Task<OrderDetailDto?> SavePackingAsync(int orderId, PackingSubmitDto dto);
    Task<OrderDetailDto?> SubmitDispatchAsync(int orderId, DispatchOrderDto dto);
    Task<OrderDetailDto?> ConfirmArrivalAsync(int orderId);
    Task<OrderDetailDto?> CompleteTransactionAsync(int orderId, BranchCheckSubmitDto dto);
    Task<OrderDetailDto?> CancelOrderAsync(int orderId, CancelOrderDto dto);
    Task<List<OrderMessageDto>> GetMessagesAsync(int orderId);
    Task<OrderMessageDto?> SendMessageAsync(int orderId, SendMessageDto dto);
}
