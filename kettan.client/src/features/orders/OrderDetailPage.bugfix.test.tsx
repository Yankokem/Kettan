import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OrderDetailPage } from './OrderDetailPage';
import { useAuthStore } from '../../store/useAuthStore';
import * as api from '../branch-operations/api';
import type { OrderDetail } from '../branch-operations/api';

// Mock dependencies
vi.mock('../../store/useAuthStore');
vi.mock('../branch-operations/api');
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ orderId: '123' }),
}));
vi.mock('../../components/UI/BackButton', () => ({
  BackButton: () => <div>Back Button</div>,
}));
vi.mock('./components/OrderFulfillmentStepper', () => ({
  OrderFulfillmentStepper: () => <div>Stepper</div>,
}));
vi.mock('./components/OrderDetailsPanel', () => ({
  OrderDetailsPanel: ({ order, orderId }: { order?: OrderDetail; orderId?: string }) => (
    <div data-testid="order-details-panel">
      {orderId && <div data-testid="panel-orderid-prop">{orderId}</div>}
      {order && <div data-testid="panel-order-prop">{JSON.stringify(order)}</div>}
    </div>
  ),
}));
vi.mock('./components/DispatchAssignmentCard', () => ({
  default: () => <div>Dispatch Card</div>,
}));
vi.mock('../supply-requests/components/SRItemTable', () => ({
  default: () => <div>Item Table</div>,
}));

const mockOrderBase: OrderDetail = {
  orderId: 123,
  requestId: 456,
  branchId: 1,
  branchName: 'Test Branch',
  status: 'Processing',
  pushedToFulfillmentAt: '2024-01-15T10:30:00Z',
  itemsCount: 3,
  fulfillmentCost: 150.0,
  requestStatus: 'Approved',
  requestedByUserId: 10,
  requestedByName: 'John Doe',
  notes: 'Test notes',
  trackingNumber: null,
  vehicleId: null,
  dispatchDate: null,
  estimatedArrival: null,
  arrivedAt: null,
  arrivedConfirmedByName: null,
  completedAt: null,
  completedByName: null,
  requestedItems: [
    {
      requestItemId: 1,
      itemId: 100,
      itemName: 'Coffee Beans',
      itemSku: 'SKU-001',
      quantityRequested: 10,
      quantityApproved: 10,
      unitCost: 5.0,
      isPicked: false,
      sendQuantity: null,
      isRejectedDuringPicking: false,
      pickingRejectionReason: null,
      isPacked: false,
      isBranchChecked: false,
      hqStock: 100,
    },
  ],
  allocations: [],
};

describe('Bug Condition Exploration Test - Property 1: Dispatched/Arrived Status UI Elements Missing and Hardcoded Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * Bug Condition: When status is "Dispatched" AND role is "BranchManager" or "BranchOwner"
   * Expected Behavior: "Package Arrived" button should be present
   * 
   * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
   */
  it('should display "Package Arrived" button when status is Dispatched and user is BranchManager', async () => {
    const dispatchedOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Dispatched',
      trackingNumber: 'TRK-12345',
      vehicleId: 5,
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'BranchManager', name: 'Manager User' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(dispatchedOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: "Package Arrived" button should be present
    const packageArrivedButton = screen.queryByRole('button', { name: /package arrived/i });
    expect(packageArrivedButton).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * Bug Condition: When status is "Dispatched" AND role is "BranchOwner"
   * Expected Behavior: "Package Arrived" button should be present
   */
  it('should display "Package Arrived" button when status is Dispatched and user is BranchOwner', async () => {
    const dispatchedOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Dispatched',
      trackingNumber: 'TRK-12345',
      vehicleId: 5,
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'BranchOwner', name: 'Owner User' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(dispatchedOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: "Package Arrived" button should be present
    const packageArrivedButton = screen.queryByRole('button', { name: /package arrived/i });
    expect(packageArrivedButton).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Bug Condition: When status is "Arrived" AND role is "BranchManager" AND all items checked
   * Expected Behavior: "Complete Transaction" button should be present
   * 
   * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
   */
  it('should display "Complete Transaction" button when status is Arrived, user is BranchManager, and all items are checked', async () => {
    const arrivedOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Arrived',
      arrivedAt: '2024-01-16T14:00:00Z',
      arrivedConfirmedByName: 'Manager User',
      requestedItems: [
        {
          ...mockOrderBase.requestedItems[0],
          isPicked: true,
          isPacked: true,
          isBranchChecked: true,
        },
      ],
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'BranchManager', name: 'Manager User' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(arrivedOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: "Complete Transaction" button should be present
    const completeTransactionButton = screen.queryByRole('button', { name: /complete transaction/i });
    expect(completeTransactionButton).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 1.2, 1.3, 2.2, 2.3**
   * 
   * Bug Condition: OrderDetailsPanel receives order prop with actual data
   * Expected Behavior: OrderDetailsPanel should accept order: OrderDetail prop (not orderId: string)
   * 
   * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
   */
  it('should pass full order object to OrderDetailsPanel instead of just orderId', async () => {
    const testOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Processing',
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'HqManager', name: 'HQ User' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(testOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: OrderDetailsPanel should receive the full order object
    const panelOrderProp = screen.queryByTestId('panel-order-prop');
    expect(panelOrderProp).toBeInTheDocument();

    // Assert: OrderDetailsPanel should NOT receive just orderId string
    const panelOrderIdProp = screen.queryByTestId('panel-orderid-prop');
    expect(panelOrderIdProp).not.toBeInTheDocument();
  });
});
