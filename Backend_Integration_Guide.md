# Backend Integration Guide

This document explains how to connect the Kettan frontend UI to the backend API when ready. The frontend currently uses **mock data** for all features, allowing UI development and testing without a running backend.

---

## Current Architecture

The frontend uses **local mock data files** instead of API calls. These mock data files are located in:

- `kettan.client/src/features/hq-inventory/mockData.ts` - Inventory items, units, categories, batches, transactions
- `kettan.client/src/features/menu/` - Menu items (inline in components)
- `kettan.client/src/features/branches/` - Branch data (inline in components)
- `kettan.client/src/features/staff/` - Staff data (inline in components)
- `kettan.client/src/features/orders/` - Orders data (inline in components)

---

## Integration Steps

### Step 1: Create API Service Layer

Create a new folder `kettan.client/src/services/` with API modules:

```typescript
// kettan.client/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      // Add auth token from store
      'Authorization': `Bearer ${getToken()}`,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}
```

### Step 2: Create Feature-Specific API Modules

Example for inventory:

```typescript
// kettan.client/src/services/inventoryApi.ts
import { fetchApi } from './api';
import type { InventoryItem, Batch, InventoryTransaction, StockInItem, StockOutFormData } from '../features/hq-inventory/types';

export const inventoryApi = {
  // Items
  getItems: () => fetchApi<InventoryItem[]>('/inventory/items'),
  getItem: (id: string) => fetchApi<InventoryItem>(`/inventory/items/${id}`),
  createItem: (data: Partial<InventoryItem>) => 
    fetchApi<InventoryItem>('/inventory/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: string, data: Partial<InventoryItem>) => 
    fetchApi<InventoryItem>(`/inventory/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Stock Operations
  stockIn: (items: StockInItem[]) => 
    fetchApi<void>('/inventory/stock-in', { method: 'POST', body: JSON.stringify(items) }),
  stockOut: (data: StockOutFormData) => 
    fetchApi<void>('/inventory/stock-out', { method: 'POST', body: JSON.stringify(data) }),
  
  // Batches
  getBatches: (itemId: string) => fetchApi<Batch[]>(`/inventory/items/${itemId}/batches`),
  
  // Transactions
  getTransactions: (itemId?: string) => 
    fetchApi<InventoryTransaction[]>(itemId ? `/inventory/items/${itemId}/transactions` : '/inventory/transactions'),
  
  // Categories & Units
  getCategories: () => fetchApi<InventoryCategory[]>('/inventory/categories'),
  getUnits: () => fetchApi<Unit[]>('/inventory/units'),
};
```

### Step 3: Use React Query (Recommended)

Install TanStack Query for data fetching:

```bash
npm install @tanstack/react-query
```

Create hooks:

```typescript
// kettan.client/src/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../services/inventoryApi';

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: inventoryApi.getItems,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => inventoryApi.getItem(id),
    enabled: !!id,
  });
}

export function useStockIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: inventoryApi.stockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
    },
  });
}
```

### Step 4: Update Components

Replace mock data imports with hooks:

**Before (with mock data):**
```typescript
// InventoryPage.tsx
import { MOCK_INVENTORY_ITEMS, MOCK_TRANSACTIONS } from './mockData';

export function InventoryPage() {
  return (
    <InventoryTable
      items={MOCK_INVENTORY_ITEMS}
      transactions={MOCK_TRANSACTIONS}
    />
  );
}
```

**After (with API):**
```typescript
// InventoryPage.tsx
import { useInventoryItems, useInventoryTransactions } from '../../hooks/useInventory';

export function InventoryPage() {
  const { data: items = [], isLoading: itemsLoading } = useInventoryItems();
  const { data: transactions = [], isLoading: txnLoading } = useInventoryTransactions();
  
  if (itemsLoading || txnLoading) return <LoadingSpinner />;
  
  return (
    <InventoryTable
      items={items}
      transactions={transactions}
    />
  );
}
```

---

## Files to Update Per Feature

### Inventory Feature

| File | Changes Needed |
|------|----------------|
| `InventoryPage.tsx` | Replace `MOCK_*` imports with `useInventoryItems()`, `useInventoryTransactions()` |
| `InventoryItemProfilePage.tsx` | Replace mock data with `useInventoryItem(itemId)`, `useBatches(itemId)` |
| `StockInPage.tsx` | Use `useInventoryItems()`, `useCategories()`, `useUnits()`, `useStockIn()` mutation |
| `StockOutModal.tsx` | Use `useBatches()`, `useStockOut()` mutation |
| `components/InventoryTable.tsx` | No changes (receives data as props) |

### Menu Feature

| File | Changes Needed |
|------|----------------|
| `MenuItemsPage.tsx` | Replace inline `MOCK_MENU_ITEMS` with `useMenuItems()` |
| `MenuItemProfilePage.tsx` | Replace inline mock with `useMenuItem(id)` |
| `AddMenuItemPage.tsx` | Use `useCategories()`, `useInventoryItems()`, `useCreateMenuItem()` |

### Staff Feature

| File | Changes Needed |
|------|----------------|
| `StaffPage.tsx` | Replace inline mock with `useStaff()` |
| `StaffProfilePage.tsx` | Replace inline mock with `useStaffMember(id)` |
| `AddStaffPage.tsx` | Use `useCreateStaff()` mutation |

### Branches Feature

| File | Changes Needed |
|------|----------------|
| `BranchesPage.tsx` | Replace inline mock with `useBranches()` |
| `BranchProfilePage.tsx` | Replace inline mock with `useBranch(id)` |
| `BranchInventoryDetailPage.tsx` | Replace `MOCK_BRANCH_STOCK` with `useBranchInventory(branchId)` |

---

## Environment Variables

Create a `.env` file in `kettan.client/`:

```env
VITE_API_URL=https://localhost:5001/api
```

For production:

```env
VITE_API_URL=https://your-api-domain.com/api
```

---

## Backend API Endpoints Required

Based on the current UI, the backend needs these endpoints:

### Inventory
- `GET /api/inventory/items` - List all inventory items
- `GET /api/inventory/items/:id` - Get single item with batches
- `POST /api/inventory/items` - Create new item
- `PUT /api/inventory/items/:id` - Update item
- `DELETE /api/inventory/items/:id` - Soft delete item
- `POST /api/inventory/stock-in` - Stock-in operation (creates batches)
- `POST /api/inventory/stock-out` - Stock-out operation
- `GET /api/inventory/transactions` - List all transactions
- `GET /api/inventory/items/:id/transactions` - Transactions for an item
- `GET /api/inventory/items/:id/batches` - Batches for an item
- `GET /api/inventory/categories` - List categories
- `GET /api/inventory/units` - List units

### Menu
- `GET /api/menu/items` - List menu items
- `GET /api/menu/items/:id` - Get single menu item with variants
- `POST /api/menu/items` - Create menu item
- `PUT /api/menu/items/:id` - Update menu item
- `GET /api/menu/categories` - List menu categories
- `POST /api/menu/categories` - Create menu category
- `PUT /api/menu/categories/:id` - Update menu category
- `DELETE /api/menu/categories/:id` - Soft delete menu category

### Staff
- `GET /api/staff` - List staff members
- `GET /api/staff/:id` - Get single staff member
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:id` - Update staff member

### Branches
- `GET /api/branches` - List branches
- `GET /api/branches/:id` - Get single branch
- `POST /api/branches` - Create branch
- `PUT /api/branches/:id` - Update branch
- `GET /api/branches/:id/inventory` - Branch inventory levels

### Settings: Item Categories and Vehicles
- `GET /api/item-categories` - List item categories
- `POST /api/item-categories` - Create item category
- `PUT /api/item-categories/:id` - Update item category
- `DELETE /api/item-categories/:id` - Soft delete item category
- `GET /api/couriers` - List couriers
- `POST /api/couriers` - Create courier
- `GET /api/couriers/:id/vehicles` - List vehicles by courier
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Soft delete vehicle

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

---

## Quick Toggle: Mock vs API

For easy switching during development, create a feature flag:

```typescript
// kettan.client/src/config.ts
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// In your hooks:
export function useInventoryItems() {
  if (USE_MOCK_DATA) {
    return { data: MOCK_INVENTORY_ITEMS, isLoading: false };
  }
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: inventoryApi.getItems,
  });
}
```

Set in `.env`:
```env
VITE_USE_MOCK_DATA=true  # Use mock data
VITE_USE_MOCK_DATA=false # Use real API
```

---

## Database Schema Reference

See `Kettan.Server/schema.sql` for the complete database schema. The schema includes:

1. **Tenants** - Multi-tenant support
2. **Inventory** - Items, Units, Categories, Batches
3. **Transactions** - Stock movements
4. **Staff** - Users and roles
5. **Branches** - Locations
6. **Menu** - Menu items, categories, variants

---

## Notes

- All mock data files can be deleted once API integration is complete
- The `types.ts` files define the TypeScript interfaces that should match API responses
- Consider using Zod for runtime validation of API responses
- Add error boundaries and loading states to all pages using API data
