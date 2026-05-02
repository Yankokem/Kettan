import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
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
      <div data-testid="panel-rendered">Panel Rendered</div>
    </div>
  ),
}));
vi.mock('./components/DispatchAssignmentCard', () => ({
  default: () => <div data-testid="dispatch-assignment-card">Dispatch Card</div>,
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

/**
 * Preservation Property Tests - Property 2: Non-Dispatched/Arrived Status Behavior Unchanged
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * These tests observe and capture the CURRENT behavior on UNFIXED code for statuses
 * other than "Dispatched" and "Arrived". They should PASS on unfixed code to establish
 * the baseline behavior that must be preserved after the fix.
 */
describe('Preservation Property Tests - Property 2: Non-Dispatched/Arrived Status Behavior Unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 3.1**
   * 
   * Preservation: Status "Processing" → "Start Picking" button displays for HQ users
   * This test observes the current behavior and ensures it remains unchanged after the fix.
   */
  it('should display "Start Picking" button when status is Processing and user is HQ role', async () => {
    const processingOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Processing',
    };

    // Test with HqManager role
    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'HqManager', name: 'HQ Manager' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(processingOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: "Start Picking" button should be present for Processing status
    const startPickingButton = screen.queryByRole('button', { name: /start picking/i });
    expect(startPickingButton).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 3.1**
   * 
   * Property-based test: For any HQ role (HqManager, HqStaff, TenantAdmin),
   * the "Start Picking" button should display when status is "Processing"
   */
  it('property: should display "Start Picking" button for Processing status across all HQ roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('HqManager', 'HqStaff', 'TenantAdmin'),
        async (role) => {
          vi.clearAllMocks();

          const processingOrder: OrderDetail = {
            ...mockOrderBase,
            status: 'Processing',
          };

          vi.mocked(useAuthStore).mockReturnValue({
            user: { userId: 1, role, name: `${role} User` },
          } as any);

          vi.mocked(api.fetchOrderById).mockResolvedValue(processingOrder);

          const { unmount } = render(<OrderDetailPage />);

          await waitFor(() => {
            expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
          });

          const startPickingButton = screen.queryByRole('button', { name: /start picking/i });
          expect(startPickingButton).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 3.2**
   * 
   * Preservation: Status "Picking" → "Update Picking" button displays for HQ users
   */
  it('should display "Update Picking" button when status is Picking and user is HQ role', async () => {
    const pickingOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Picking',
      requestedItems: [
        {
          ...mockOrderBase.requestedItems[0],
          isPicked: true,
          sendQuantity: 10,
        },
      ],
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'HqManager', name: 'HQ Manager' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(pickingOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: "Update Picking" button should be present for Picking status
    const updatePickingButton = screen.queryByRole('button', { name: /update picking/i });
    expect(updatePickingButton).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 3.2**
   * 
   * Property-based test: For any HQ role, the "Update Picking" button should display
   * when status is "Picking" and at least one item is picked
   */
  it('property: should display "Update Picking" button for Picking status across all HQ roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('HqManager', 'HqStaff', 'TenantAdmin'),
        async (role) => {
          vi.clearAllMocks();

          const pickingOrder: OrderDetail = {
            ...mockOrderBase,
            status: 'Picking',
            requestedItems: [
              {
                ...mockOrderBase.requestedItems[0],
                isPicked: true,
                sendQuantity: 10,
              },
            ],
          };

          vi.mocked(useAuthStore).mockReturnValue({
            user: { userId: 1, role, name: `${role} User` },
          } as any);

          vi.mocked(api.fetchOrderById).mockResolvedValue(pickingOrder);

          const { unmount } = render(<OrderDetailPage />);

          await waitFor(() => {
            expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
          });

          const updatePickingButton = screen.queryByRole('button', { name: /update picking/i });
          expect(updatePickingButton).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 3.3**
   * 
   * Preservation: Status "Packing" → "Confirm Items Packed" button displays for HQ users
   */
  it('should display "Confirm Items Packed" button when status is Packing and user is HQ role', async () => {
    const packingOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Packing',
      requestedItems: [
        {
          ...mockOrderBase.requestedItems[0],
          isPicked: true,
          sendQuantity: 10,
          isPacked: true,
        },
      ],
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'HqManager', name: 'HQ Manager' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(packingOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: "Confirm Items Packed" button should be present for Packing status
    const confirmPackedButton = screen.queryByRole('button', { name: /confirm items packed/i });
    expect(confirmPackedButton).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 3.3**
   * 
   * Property-based test: For any HQ role, the "Confirm Items Packed" button should display
   * when status is "Packing" and all items are packed
   */
  it('property: should display "Confirm Items Packed" button for Packing status across all HQ roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('HqManager', 'HqStaff', 'TenantAdmin'),
        async (role) => {
          vi.clearAllMocks();

          const packingOrder: OrderDetail = {
            ...mockOrderBase,
            status: 'Packing',
            requestedItems: [
              {
                ...mockOrderBase.requestedItems[0],
                isPicked: true,
                sendQuantity: 10,
                isPacked: true,
              },
            ],
          };

          vi.mocked(useAuthStore).mockReturnValue({
            user: { userId: 1, role, name: `${role} User` },
          } as any);

          vi.mocked(api.fetchOrderById).mockResolvedValue(packingOrder);

          const { unmount } = render(<OrderDetailPage />);

          await waitFor(() => {
            expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
          });

          const confirmPackedButton = screen.queryByRole('button', { name: /confirm items packed/i });
          expect(confirmPackedButton).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 3.4**
   * 
   * Preservation: Status "Packed" → DispatchAssignmentCard displays for HQ users
   */
  it('should display DispatchAssignmentCard when status is Packed and user is HQ role', async () => {
    const packedOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Packed',
      requestedItems: [
        {
          ...mockOrderBase.requestedItems[0],
          isPicked: true,
          sendQuantity: 10,
          isPacked: true,
        },
      ],
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'HqManager', name: 'HQ Manager' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(packedOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: DispatchAssignmentCard should be present for Packed status
    const dispatchCard = screen.queryByTestId('dispatch-assignment-card');
    expect(dispatchCard).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 3.4**
   * 
   * Property-based test: For any HQ role, the DispatchAssignmentCard should display
   * when status is "Packed"
   */
  it('property: should display DispatchAssignmentCard for Packed status across all HQ roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('HqManager', 'HqStaff', 'TenantAdmin'),
        async (role) => {
          vi.clearAllMocks();

          const packedOrder: OrderDetail = {
            ...mockOrderBase,
            status: 'Packed',
            requestedItems: [
              {
                ...mockOrderBase.requestedItems[0],
                isPicked: true,
                sendQuantity: 10,
                isPacked: true,
              },
            ],
          };

          vi.mocked(useAuthStore).mockReturnValue({
            user: { userId: 1, role, name: `${role} User` },
          } as any);

          vi.mocked(api.fetchOrderById).mockResolvedValue(packedOrder);

          const { unmount } = render(<OrderDetailPage />);

          await waitFor(() => {
            expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
          });

          const dispatchCard = screen.queryByTestId('dispatch-assignment-card');
          expect(dispatchCard).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 3.5**
   * 
   * Preservation: Status "Delivered" with branch role → "File Return" button displays
   */
  it('should display "File Return" button when status is Delivered and user is branch role', async () => {
    const deliveredOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Delivered',
      completedAt: '2024-01-17T10:00:00Z',
      completedByName: 'Branch Manager',
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'BranchManager', name: 'Branch Manager' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(deliveredOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: "File Return" button should be present for Delivered status with branch role
    const fileReturnButton = screen.queryByRole('button', { name: /file return/i });
    expect(fileReturnButton).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 3.5**
   * 
   * Property-based test: For any branch role (BranchManager, BranchOwner),
   * the "File Return" button should display when status is "Delivered"
   */
  it('property: should display "File Return" button for Delivered status across all branch roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('BranchManager', 'BranchOwner'),
        async (role) => {
          vi.clearAllMocks();

          const deliveredOrder: OrderDetail = {
            ...mockOrderBase,
            status: 'Delivered',
            completedAt: '2024-01-17T10:00:00Z',
            completedByName: 'Branch User',
          };

          vi.mocked(useAuthStore).mockReturnValue({
            user: { userId: 1, role, name: `${role} User` },
          } as any);

          vi.mocked(api.fetchOrderById).mockResolvedValue(deliveredOrder);

          const { unmount } = render(<OrderDetailPage />);

          await waitFor(() => {
            expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
          });

          const fileReturnButton = screen.queryByRole('button', { name: /file return/i });
          expect(fileReturnButton).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 3.6**
   * 
   * Preservation: All statuses → OrderDetailsPanel displays data
   * (Currently hardcoded, but after fix should show actual data for all statuses)
   */
  it('should display OrderDetailsPanel for all order statuses', async () => {
    const testOrder: OrderDetail = {
      ...mockOrderBase,
      status: 'Processing',
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 1, role: 'HqManager', name: 'HQ Manager' },
    } as any);

    vi.mocked(api.fetchOrderById).mockResolvedValue(testOrder);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
    });

    // Assert: OrderDetailsPanel should be rendered
    const panel = screen.queryByTestId('order-details-panel');
    expect(panel).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements 3.6**
   * 
   * Property-based test: For any order status (excluding Dispatched/Arrived which are tested separately),
   * the OrderDetailsPanel should be rendered
   */
  it('property: should display OrderDetailsPanel for all non-Dispatched/Arrived statuses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Processing', 'Picking', 'Packing', 'Packed', 'Delivered'),
        fc.constantFrom('HqManager', 'HqStaff', 'TenantAdmin', 'BranchManager', 'BranchOwner'),
        async (status, role) => {
          vi.clearAllMocks();

          const testOrder: OrderDetail = {
            ...mockOrderBase,
            status: status as any,
          };

          vi.mocked(useAuthStore).mockReturnValue({
            user: { userId: 1, role, name: `${role} User` },
          } as any);

          vi.mocked(api.fetchOrderById).mockResolvedValue(testOrder);

          const { unmount } = render(<OrderDetailPage />);

          await waitFor(() => {
            expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
          });

          const panel = screen.queryByTestId('order-details-panel');
          expect(panel).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
   * 
   * Comprehensive property-based test: Verify that for all non-Dispatched/Arrived statuses,
   * the appropriate UI elements are displayed based on status and role combinations
   */
  it('property: comprehensive preservation test for all non-Dispatched/Arrived status workflows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          status: fc.constantFrom('Processing', 'Picking', 'Packing', 'Packed', 'Delivered'),
          role: fc.constantFrom('HqManager', 'HqStaff', 'TenantAdmin', 'BranchManager', 'BranchOwner'),
        }),
        async ({ status, role }) => {
          vi.clearAllMocks();

          const testOrder: OrderDetail = {
            ...mockOrderBase,
            status: status as any,
            requestedItems: [
              {
                ...mockOrderBase.requestedItems[0],
                isPicked: status !== 'Processing',
                sendQuantity: status !== 'Processing' ? 10 : null,
                isPacked: ['Packing', 'Packed', 'Delivered'].includes(status),
              },
            ],
          };

          vi.mocked(useAuthStore).mockReturnValue({
            user: { userId: 1, role, name: `${role} User` },
          } as any);

          vi.mocked(api.fetchOrderById).mockResolvedValue(testOrder);

          const { unmount } = render(<OrderDetailPage />);

          await waitFor(() => {
            expect(screen.queryByText('Loading order…')).not.toBeInTheDocument();
          });

          // Verify OrderDetailsPanel is always rendered
          const panel = screen.queryByTestId('order-details-panel');
          expect(panel).toBeInTheDocument();

          // Verify status-specific UI elements based on role
          const isHqRole = ['HqManager', 'HqStaff', 'TenantAdmin'].includes(role);
          const isBranchRole = ['BranchManager', 'BranchOwner'].includes(role);

          if (status === 'Processing' && isHqRole) {
            const startPickingButton = screen.queryByRole('button', { name: /start picking/i });
            expect(startPickingButton).toBeInTheDocument();
          }

          if (status === 'Picking' && isHqRole) {
            const updatePickingButton = screen.queryByRole('button', { name: /update picking/i });
            expect(updatePickingButton).toBeInTheDocument();
          }

          if (status === 'Packing' && isHqRole) {
            const confirmPackedButton = screen.queryByRole('button', { name: /confirm items packed/i });
            expect(confirmPackedButton).toBeInTheDocument();
          }

          if (status === 'Packed' && isHqRole) {
            const dispatchCard = screen.queryByTestId('dispatch-assignment-card');
            expect(dispatchCard).toBeInTheDocument();
          }

          if (status === 'Delivered' && isBranchRole) {
            const fileReturnButton = screen.queryByRole('button', { name: /file return/i });
            expect(fileReturnButton).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });
});
