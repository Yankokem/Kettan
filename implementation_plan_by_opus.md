# Branch Access Control, Menu & Inventory Scoping Overhaul

> [!NOTE]
> This plan is designed as a **handoff document** for AI agents to execute. Every change includes exact file paths, line numbers, code patterns, and architectural context.

---

## Tech Stack Context
- **Backend**: ASP.NET 10 Web API, SQL Server, Entity Framework Core
- **Frontend**: React 19 + TypeScript + Vite, MUI v6, TanStack Router, Zustand
- **Design System**: Kettan coffee-themed palette (`#6B4C2A` brown, `#C9A84C` gold, `#FAF5EF` cream)
- **Hosting**: MonsterASP.net, CI/CD via GitHub Actions (do NOT auto-push or open browser)

---

## Change 1: Correct Menu Management Access ✅ COMPLETED (NO-OP)

**Clarified Logic**: The Tenant Admin and HQ users manage a coffee chain — **they** decide what's on the menu. Menu Management (create/edit/delete) is an HQ-level function. Branches do NOT get their own "Menu & Recipes" sidebar link — they see HQ-created menus **read-only** through the Branch Profile's "Menu" tab (Change 2).

**Current State**: In `roleHelpers.ts` line 69, `'menu': ['TenantAdmin', 'HqManager']` — this is **already correct**. No change needed.

### ❌ NO FILES TO MODIFY — Current permissions are correct as-is.

The `menu` module stays accessible to `TenantAdmin` and `HqManager` only. Branch users (`BranchOwner`, `BranchManager`) will see menu items **only** through the read-only Branch Profile Menu tab (Change 2), not through the sidebar.

---

## Change 2: Add Menu Tab to Branch Profile View ✅ COMPLETED

**Problem**: Branch profile has 5 tabs (Details, Staff, Activity, Transactions, Inventory) but no Menu tab. Branches should see what menu items are available and whether they have the ingredients in stock.

### Files to Modify

#### [MODIFY] [branchProfileData.ts](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branches/branchProfileData.ts)

**Line 6 area** — Add import:
```typescript
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
```

**Line 53** — Add `menu` entry to `BRANCH_PROFILE_TABS` array (after `inventory`):
```typescript
{ key: 'menu', label: 'Menu', icon: LocalCafeRoundedIcon },
```

**types.ts line 56** — Update `BranchProfileTabKey` union:
```diff
-export type BranchProfileTabKey = 'details' | 'staff' | 'activity' | 'transactions' | 'inventory';
+export type BranchProfileTabKey = 'details' | 'staff' | 'activity' | 'transactions' | 'inventory' | 'menu';
```

Add a `buildMenuKpis` function (similar pattern to `buildStaffKpis` at line 222):
```typescript
const buildMenuKpis = ({ menuItems }: BranchKpiContext): BranchProfileKpi[] => {
  const active = menuItems.filter(m => m.status === 'Active').length;
  const inactive = menuItems.filter(m => m.status === 'Inactive').length;
  const outOfStock = menuItems.filter(m => m.status === 'Out of Stock').length;
  return [
    { id: 'menu-total', label: 'Total Menu Items', value: menuItems.length.toString(), icon: LocalCafeRoundedIcon, iconColor: '#6B4C2A', iconBg: 'rgba(107,76,42,0.16)' },
    { id: 'menu-active', label: 'Active', value: active.toString(), icon: CheckCircleRoundedIcon, iconColor: '#166534', iconBg: '#DCFCE7' },
    { id: 'menu-inactive', label: 'Inactive', value: inactive.toString(), icon: BlockRoundedIcon, iconColor: '#991B1B', iconBg: '#FEE2E2' },
    { id: 'menu-oos', label: 'Out of Stock', value: outOfStock.toString(), icon: WarningAmberRoundedIcon, iconColor: '#B45309', iconBg: '#FEF3C7' },
  ];
};
```

Update `BranchKpiContext` interface (line 40) to include `menuItems`:
```typescript
interface BranchKpiContext {
  branch: Branch;
  employees: BranchEmployee[];
  activityLogs: BranchActivityLog[];
  transactions: BranchTransactionRow[];
  inventoryItems: BranchInventoryItem[];
  menuItems: { status: string }[];
}
```

Update `getKpisForTab` switch (line 386) to add `case 'menu': return buildMenuKpis(context);`.


#### [NEW] [BranchMenuTab.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branches/components/profile/BranchMenuTab.tsx)

Create a **read-only** table displaying **HQ-created** menu items. Pattern: follow `BranchStaffTab.tsx` structure.

**Key Principle**: Branches do NOT create or edit menu items. The HQ (TenantAdmin/HqManager) defines the master menu catalog. This tab shows what the branch is expected to serve, and flags problems.

- Import `fetchMenuItems` from `../../../menu/menuItemsApi` (same endpoint as the HQ Menu page — the menu is tenant-wide)
- Displays columns: Name, Category, Base Price (₱), Status, Variants count, **Availability**
- Status chip: Active = green, Inactive = grey, Out of Stock = red
- Each row links to `/menu/$menuItemId` for full details (view-only for branch users, since the menu management page checks role for edit/delete actions)
- Search bar + category filter + sort dropdown (reuse `SearchInput`, `FilterDropdown`)
- **ABSOLUTELY no create/edit/delete buttons** — this is view-only from the branch perspective

**Ingredient Availability Logic** (the key feature):
For each menu item, cross-reference the item's recipe ingredients against the branch's inventory:
1. Get all `variants[].ingredients[].itemId` from the menu item's recipe
2. Check if each `itemId` exists in the branch's inventory items (passed via props from `BranchProfilePage`)
3. If ALL ingredients are in stock → show ✅ "Available" chip (green)
4. If SOME ingredients are missing → show ⚠️ "Partial" chip (amber/yellow) with tooltip listing missing items
5. If NO ingredients are in stock → show ❌ "Unavailable" chip (red)
6. If a menu item has no recipe/ingredients defined → show "No Recipe" chip (grey)

This gives branch managers instant visibility into what they can actually serve vs what needs restocking.

#### [MODIFY] [BranchProfilePage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branches/BranchProfilePage.tsx)

**Imports** — Add:
```typescript
import { BranchMenuTab } from './components/profile/BranchMenuTab';
import { fetchMenuItems } from '../menu/menuItemsApi';
import type { MenuItemDto } from '../menu/menuItemsApi';
```

**State** — Add:
```typescript
const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
```

**loadTabContent** (line 102) — Add case:
```typescript
case 'menu':
  const menuDto = await fetchMenuItems();
  setMenuItems(menuDto);
  break;
```

**tabBadges** (line 165) — Add: `menu: menuItems.length`

**kpis context** — Add `menuItems: menuItems.map(m => ({ status: m.status }))` to the context object.

**Render section** (after line 344) — Add:
```tsx
{activeTab === 'menu' ? <BranchMenuTab menuItems={menuItems} branchInventoryItems={inventoryItems} /> : null}
```

---

## Change 3: Remove Card View from Branch Inventory Tab ✅ COMPLETED

**Problem**: `BranchInventoryTab.tsx` has a card/table toggle. User wants table only.

#### [MODIFY] [BranchInventoryTab.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branches/components/profile/BranchInventoryTab.tsx)

1. **Remove imports** (line 6-8): `ToggleButton`, `ToggleButtonGroup`, `Pagination`, `ViewModuleRoundedIcon`, `ViewListRoundedIcon`
2. **Remove import** (line 16): `BranchInventoryCard`
3. **Remove state** (line 51): `const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');`
4. **Remove state** (line 52): `const [page, setPage] = useState(1);`
5. **Remove** `useEffect` for page reset (line 111-113) — remove `viewMode` from dependency
6. **Remove** `pageCount` and `pagedItems` calculations (lines 115-120)
7. **Remove** the entire `ToggleButtonGroup` JSX block (lines 236-265)
8. **Remove** the card view conditional branch (lines 282-311) — the `viewMode === 'cards'` block
9. **Always render** the `DataTable` directly (what's currently in the `else` branch, lines 312-321)

**Result**: The component always shows the table view. No toggle, no cards, no pagination for cards.

---

## Change 4: Branch Profile Page for Branch Users ✅ COMPLETED

**Problem**: The current `BranchProfilePage.tsx` is the TenantAdmin's detailed view (tabs, edit modal, KPIs). Branch users need a simpler, **read-only** profile page — just the branch info, like the Company Profile page layout.

### Design Reference
Follow the **CompanyProfilePage** pattern at `kettan.client/src/features/company/CompanyProfilePage.tsx`:
- Banner gradient header with branch image/avatar
- Branch name overlaid on banner
- Below banner: info chips (location, status, branch code)
- Two-column layout:
  - **Left (8 cols)**: "Branch Details" card with fields (Name, Status, Address, City, Contact, Open/Close Time, Manager, Owner, Notes)
  - **Right (4 cols)**: Summary card with staff count, inventory count, quick links
- **No edit button, no tabs, no modals** — purely informational

### Files to Create/Modify

#### [NEW] [BranchInfoPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branches/BranchInfoPage.tsx)

This is the **branch-user-facing** profile page. Key details:
- Fetch branch data using `fetchBranch(branchId)` from `branchesApi.ts` where `branchId` comes from the logged-in user's `user.branchId` (from `useAuthStore`)
- Use `mapBranch()` from `branchProfileData.ts` to transform DTO
- Layout mimics CompanyProfilePage:
  - Banner with gradient `linear-gradient(135deg, #6A4120 0%, #8C5F2B 34%, #B78644 68%, #E1C26F 100%)`
  - Avatar (branch image or initials)
  - Chips: location city, status, branch code
  - `DetailRow` component for each field (same as CompanyProfilePage's `DetailRow`)
  - Right sidebar: staff count (fetch from `/api/users?branchId=X`), inventory item count
- **No edit functionality** — read-only display

#### [MODIFY] [router.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/app/router.tsx)
Add route:
```typescript
import { BranchInfoPage } from '../features/branches/BranchInfoPage';

const branchInfoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/branch-profile',
  component: BranchInfoPage,
});
```
Add `branchInfoRoute` to the `layoutRoute.addChildren([...])` array.

#### [MODIFY] [roleHelpers.ts](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/utils/roleHelpers.ts)
Add permission:
```typescript
'branch-profile': ['BranchOwner', 'BranchManager'],
```

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/components/Layout/Sidebar.tsx)
Add nav item to `MAIN_NAV` array (around line 60, before or after "Branch and Inventory"):
```typescript
{ text: 'Branch Profile', icon: <StoreRoundedIcon />, path: '/branch-profile', module: 'branch-profile' },
```

---

## Change 5: Branch-Scoped Inventory (Reuse Existing Page) ✅ COMPLETED

**Problem**: Branch users need their own inventory page. User wants to **reuse the same InventoryPage** component but with branch-scoped data.

### Architecture Discovery
- `Batch.BranchId` (nullable) already separates HQ (`null`) vs branch inventory. ✅
- `ItemsController.GetItems()` already accepts `?branchId=X` and filters batches. ✅
- `hqInventoryApi.ts` `fetchInventoryItems()` currently passes NO branchId — returns all stock combined. ❌
- User wants: HQ Inventory page shows **full catalog with all stock** (current behavior), but we need an `hqOnly` param for supply requests.

### Backend Changes

#### [MODIFY] [ItemsController.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Controllers/ItemsController.cs)
**Line 33-37** — Add `hqOnly` parameter:
```csharp
public async Task<ActionResult<List<ItemDto>>> GetItems(
    [FromQuery] int? inventoryCategoryId = null,
    [FromQuery] int? itemCategoryId = null,
    [FromQuery] string? search = null,
    [FromQuery] int? branchId = null,
    [FromQuery] bool hqOnly = false)
```

**Line 70-75** — Update batch query logic:
```csharp
var batchQuery = _context.Batches.Where(b => itemIds.Contains(b.ItemId));

if (hqOnly)
{
    batchQuery = batchQuery.Where(b => b.BranchId == null);
}
else if (branchId.HasValue)
{
    batchQuery = batchQuery.Where(b => b.BranchId == branchId.Value);
}
```

### Frontend Changes

#### [MODIFY] [hqInventoryApi.ts](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/hq-inventory/hqInventoryApi.ts)
**Line 297-303** — Add optional params:
```typescript
export async function fetchInventoryItems(
  search?: string,
  options?: { branchId?: number; hqOnly?: boolean }
): Promise<InventoryItem[]> {
  const params: Record<string, any> = {};
  if (search) params.search = search;
  if (options?.branchId) params.branchId = options.branchId;
  if (options?.hqOnly) params.hqOnly = true;

  const response = await api.get<ItemDto[]>('/api/items', { params });
  return response.data.map(toItem);
}
```

> [!WARNING]
> This changes the function signature. All existing callers must be checked. Current callers:
> - `InventoryPage.tsx` line 29: `fetchInventoryItems()` — no change needed (no params = full catalog)
> - `SupplyRequestCreatePage.tsx` line 59: `fetchInventoryItems()` — will be updated in Change 6
> - `InventoryItemProfilePage.tsx` — uses `fetchInventoryItemDetail()` not affected

#### [MODIFY] [InventoryPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/hq-inventory/InventoryPage.tsx)
Make this page work for both HQ users and branch users. Read `user.branchId` from auth store:

```typescript
import { useAuthStore } from '../../store/useAuthStore';
// ...
const { user } = useAuthStore();
const isBranchUser = user?.branchId != null;
const branchId = user?.branchId ?? undefined;
```

When loading inventory (line 29):
```typescript
const liveItems = await fetchInventoryItems(undefined, 
  isBranchUser ? { branchId } : undefined
);
```

Conditionally hide HQ-only toolbar actions (Categories, Vehicles, New Transaction buttons in `InventoryTable.tsx`) when `isBranchUser` is true. Pass a prop like `readOnly` or `isBranchView` to `InventoryTable`.

#### [MODIFY] [InventoryTable.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/hq-inventory/components/InventoryTable.tsx)
**Add prop** `isBranchView?: boolean` to `InventoryTableProps` interface.

When `isBranchView` is true:
- Hide "Item Categories", "Vehicles", "New Transaction" buttons (lines 417-436)
- Change page title context if needed
- Row clicks can still navigate to item detail

#### [MODIFY] [roleHelpers.ts](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/utils/roleHelpers.ts)
The user said to reuse the same page and call it just "Inventory". So update the existing `hq-inventory` module permission to include branch roles:
```diff
-    'hq-inventory': ['TenantAdmin', 'HqManager', 'HqStaff'],
+    'hq-inventory': ['TenantAdmin', 'HqManager', 'HqStaff', 'BranchOwner', 'BranchManager'],
```

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/components/Layout/Sidebar.tsx)
**Line 62** — Change the label conditionally or just rename:
```diff
-  { text: 'HQ Inventory', icon: <Inventory2RoundedIcon />, path: '/hq-inventory', module: 'hq-inventory' },
+  { text: 'Inventory', icon: <Inventory2RoundedIcon />, path: '/hq-inventory', module: 'hq-inventory' },
```

---

## Change 6: Supply Request Uses HQ-Only Inventory ✅ COMPLETED

**Problem**: Supply request creation page loads ALL inventory (HQ + branches combined). It should show only HQ warehouse stock so branch managers know what's available to request.

#### [MODIFY] [SupplyRequestCreatePage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/supply-requests/SupplyRequestCreatePage.tsx)
**Line 59** — Pass `hqOnly`:
```diff
-        const rows = await fetchInventoryItems();
+        const rows = await fetchInventoryItems(undefined, { hqOnly: true });
```

This ensures the stock numbers shown in the inventory selection modal reflect HQ warehouse quantities only.

---

## Summary of All File Changes

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `kettan.client/src/utils/roleHelpers.ts` | NO CHANGE | Menu permissions already correct (`TenantAdmin`, `HqManager`). Only add branch-profile module + hq-inventory branch roles |
| 2 | `kettan.client/src/components/Layout/Sidebar.tsx` | MODIFY | Rename "HQ Inventory" → "Inventory", add "Branch Profile" nav item |
| 3 | `kettan.client/src/features/branches/types.ts` | MODIFY | Add `'menu'` to `BranchProfileTabKey` union |
| 4 | `kettan.client/src/features/branches/branchProfileData.ts` | MODIFY | Add menu tab definition, menu KPI builder, update context type |
| 5 | `kettan.client/src/features/branches/components/profile/BranchMenuTab.tsx` | NEW | Read-only menu table for branch profile |
| 6 | `kettan.client/src/features/branches/components/profile/BranchInventoryTab.tsx` | MODIFY | Remove card view, table only |
| 7 | `kettan.client/src/features/branches/BranchProfilePage.tsx` | MODIFY | Add menu tab fetching + rendering |
| 8 | `kettan.client/src/features/branches/BranchInfoPage.tsx` | NEW | Simple read-only branch info page (like CompanyProfile) |
| 9 | `kettan.client/src/app/router.tsx` | MODIFY | Add `/branch-profile` route |
| 10 | `kettan.client/src/features/hq-inventory/hqInventoryApi.ts` | MODIFY | Add `branchId` and `hqOnly` params to `fetchInventoryItems()` |
| 11 | `kettan.client/src/features/hq-inventory/InventoryPage.tsx` | MODIFY | Branch-scope data when logged in as branch user |
| 12 | `kettan.client/src/features/hq-inventory/components/InventoryTable.tsx` | MODIFY | Add `isBranchView` prop to hide HQ-only actions |
| 13 | `kettan.client/src/features/supply-requests/SupplyRequestCreatePage.tsx` | MODIFY | Use `hqOnly: true` for inventory fetch |
| 14 | `Kettan.Server/Controllers/ItemsController.cs` | MODIFY | Add `hqOnly` query parameter |

---

## Execution Order

1. ~~**Backend first**: Modify `ItemsController.cs` (Change 5 backend) — zero risk, additive only~~ ✅ DONE
2. **roleHelpers.ts**: Permission changes (Changes 4, 5 only — Change 1 is NO-OP) — ⚠️ Change 5 part DONE (hq-inventory perms updated), Change 4 part still needed (branch-profile module)
3. **Sidebar.tsx**: Nav changes (Changes 4, 5) — ⚠️ Change 5 part DONE (renamed to "Inventory")
4. ~~**BranchInventoryTab.tsx**: Remove card view (Change 3)~~ ✅ DONE
5. ~~**hqInventoryApi.ts**: Add params (Change 5)~~ ✅ DONE
6. ~~**InventoryPage.tsx + InventoryTable.tsx**: Branch-scope logic (Change 5)~~ ✅ DONE
7. ~~**SupplyRequestCreatePage.tsx**: hqOnly param (Change 6)~~ ✅ DONE
8. ~~**branchProfileData.ts + types.ts**: Menu tab definition (Change 2)~~ ✅ DONE
9. ~~**BranchMenuTab.tsx**: New component (Change 2)~~ ✅ DONE
10. ~~**BranchProfilePage.tsx**: Wire menu tab (Change 2)~~ ✅ DONE
11. ~~**BranchInfoPage.tsx**: New page (Change 4)~~ ✅ DONE
12. ~~**router.tsx**: Add route (Change 4)~~ ✅ DONE

---

## Verification Plan

### Build Check
```bash
cd kettan.client && npm run build   # Must produce zero TS errors
cd Kettan.Server && dotnet build    # Must produce zero C# errors
```

### Manual Testing Matrix
| Test | Login As | Expected Result |
|------|----------|----------------|
| Sidebar check | TenantAdmin | "Menu & Recipes" IS visible, "Inventory" visible |
| Sidebar check | BranchManager | "Menu & Recipes" NOT visible, "Inventory" visible, "Branch Profile" visible |
| Menu management | TenantAdmin | Can create/edit/delete menu items |
| Menu management | BranchManager | Cannot access `/menu` directly — only sees menu via Branch Profile tab (read-only) |
| Branch profile tabs | TenantAdmin | Branch profile has 6 tabs including "Menu" |
| Branch Menu tab | Any | Read-only, shows ingredient availability (✅/⚠️/❌) per item |
| Branch inventory tab | Any | Table view ONLY, no card toggle |
| Branch Profile page | BranchManager | `/branch-profile` shows read-only branch info |
| Inventory page | BranchManager | Shows only their branch's stock, no Categories/Vehicles/Transaction buttons |
| Inventory page | HqManager | Shows full catalog (all stock), all management buttons visible |
| Supply request create | BranchManager | Inventory modal shows HQ stock only |
