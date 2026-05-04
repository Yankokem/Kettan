import type { ElementType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import type {
  Branch,
  BranchActivityLog,
  BranchEmployee,
  BranchFormData,
  BranchInventoryItem,
  BranchProfileTabKey,
  BranchTransactionRow,
} from './types';

export interface BranchTabDefinition {
  key: BranchProfileTabKey;
  label: string;
  icon: ElementType<SvgIconProps>;
}

export interface BranchProfileKpi {
  id: string;
  label: string;
  value: string;
  helperText?: string;
  icon: ElementType<SvgIconProps>;
  iconColor: string;
  iconBg: string;
}

interface BranchKpiContext {
  branch: Branch;
  employees: BranchEmployee[];
  activityLogs: BranchActivityLog[];
  transactions: BranchTransactionRow[];
  inventoryItems: BranchInventoryItem[];
  menuItems: { status: string }[];
}

export const BRANCH_PROFILE_TABS: BranchTabDefinition[] = [
  { key: 'details', label: 'Details', icon: DescriptionRoundedIcon },
  { key: 'staff', label: 'Staff Roster', icon: PeopleRoundedIcon },
  { key: 'activity', label: 'Activity Logs', icon: AnalyticsRoundedIcon },
  { key: 'transactions', label: 'Transactions', icon: ReceiptLongRoundedIcon },
  { key: 'inventory', label: 'Inventory', icon: Inventory2RoundedIcon },
  { key: 'menu', label: 'Menu', icon: LocalCafeRoundedIcon },
];

export const toBranchFormData = (branch: Branch): BranchFormData => ({
  name: branch.name,
  address: branch.address,
  city: branch.city,
  contactNumber: branch.contactNumber,
  openTime: branch.openTime,
  closeTime: branch.closeTime,
  ownerUserId: branch.ownerUserId ?? '',
  managerUserId: branch.managerUserId,
  status: branch.status,
  imageUrl: branch.imageUrl,
  notes: branch.notes ?? '',
});

export const mapBranch = (dto: any): Branch => ({
  id: dto.branchId,
  name: dto.name,
  address: dto.location || 'N/A',
  city: dto.city || 'N/A',
  contactNumber: dto.contactNumber || 'N/A',
  openTime: dto.openTime || '08:00',
  closeTime: dto.closeTime || '22:00',
  ownerUserId: dto.ownerUserId?.toString(),
  owner: dto.ownerName,
  managerUserId: dto.managerUserId?.toString() || '',
  manager: dto.managerName || 'Unassigned',
  staff: dto.staffCount || 0,
  status: dto.isActive ? 'active' : 'setup',
  lowStockItems: dto.lowStockItems || 0,
  totalItems: dto.totalItems || 0,
  notes: dto.notes,
  imageUrl: dto.imageUrl,
});

export const mapActivityLog = (dto: any): BranchActivityLog => ({
  id: String(dto.id),
  branchId: dto.branchId || 0,
  event: `${dto.entityName}${dto.entityId ? ` #${dto.entityId}` : ''}`,
  actor: dto.actorName || 'System',
  role: dto.actorRole || 'System',
  action: dto.action,
  happenedAt: dto.occurredAt,
  category: (dto.eventCategory?.toLowerCase() as any) || 'operations',
  outcome: dto.action === 'Deleted' ? 'flagged' : 'successful',
});

export const mapEmployee = (dto: any): BranchEmployee => ({
  id: dto.userId,
  branchId: dto.branchId,
  firstName: dto.firstName,
  lastName: dto.lastName,
  email: dto.email || 'N/A',
  position: dto.role || 'Staff',
  contactNumber: dto.contactNo || 'N/A',
  dateHired: dto.createdAt || new Date().toISOString(),
  isActive: dto.isActive,
});

export const mapInventoryItem = (dto: any): BranchInventoryItem => ({
  id: String(dto.itemId),
  branchId: 0, // Not provided by this endpoint but contextually known
  sku: dto.sku,
  name: dto.name,
  category: dto.itemCategoryName || 'Uncategorized',
  supplier: 'General Supplier', // Not provided by item list
  unit: dto.unitSymbol || dto.unitName || 'pcs',
  stockCount: dto.totalStock || 0,
  reorderPoint: dto.defaultThreshold || 0,
  status: dto.totalStock <= 0 ? 'out-of-stock' : dto.totalStock <= dto.defaultThreshold ? 'low-stock' : 'in-stock',
  lastRestocked: dto.updatedAt,
});

export const mapTransaction = (dto: any): BranchTransactionRow => ({
  id: String(dto.consumptionLogId || dto.orderId || Math.random()),
  branchId: dto.branchId,
  reference: dto.method === 'Sales' ? `Order #${dto.consumptionLogId}` : dto.reference || `Log #${dto.consumptionLogId}`,
  type: dto.method === 'Direct' ? 'Stock-Out' : dto.method === 'Sales' ? 'Adjustment' : 'Transfer',
  lineItems: dto.items?.length || 0,
  netChange: 0, // Summation would require detailed items
  postedBy: 'Branch Manager',
  timestamp: dto.logDate || dto.createdAt,
});

export const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatSchedule = (time24: string) => {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const adjustedHour = hour % 12 || 12;
  return `${adjustedHour}:${String(minute).padStart(2, '0')} ${period}`;
};

export const isOpenNow = (openTime: string, closeTime: string) => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
};

export const getInitials = (label: string) =>
  label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const buildDetailsKpis = ({ branch, employees }: BranchKpiContext): BranchProfileKpi[] => {
  const staffExcludingOwner = employees.filter((employee) => employee.position !== 'BranchOwner');
  const activeStaff = staffExcludingOwner.filter((employee) => employee.isActive).length;

  return [
    {
      id: 'details-total-staff',
      label: 'Total Staff',
      value: staffExcludingOwner.length.toString(),
      icon: PeopleRoundedIcon,
      iconColor: '#6B4C2A',
      iconBg: 'rgba(107,76,42,0.16)',
    },
    {
      id: 'details-active-staff',
      label: 'Active Staff',
      value: activeStaff.toString(),
      icon: PersonAddAlt1RoundedIcon,
      iconColor: '#166534',
      iconBg: '#DCFCE7',
    },
    {
      id: 'details-low-stock',
      label: 'Low Stock Items',
      value: branch.lowStockItems.toString(),
      icon: WarningAmberRoundedIcon,
      iconColor: '#B45309',
      iconBg: '#FEF3C7',
    },
    {
      id: 'details-tracked-skus',
      label: 'Tracked SKUs',
      value: branch.totalItems.toString(),
      icon: Inventory2RoundedIcon,
      iconColor: '#1D4ED8',
      iconBg: '#DBEAFE',
    },
  ];
};

const buildStaffKpis = ({ employees }: BranchKpiContext): BranchProfileKpi[] => {
  const staffExcludingOwner = employees.filter((employee) => employee.position !== 'BranchOwner');
  const activeStaff = staffExcludingOwner.filter((employee) => employee.isActive).length;
  const inactiveStaff = staffExcludingOwner.length - activeStaff;
  const leadEmployees = staffExcludingOwner.filter((employee) => /(lead|supervisor|manager)/i.test(employee.position)).length;

  return [
    {
      id: 'staff-total',
      label: 'Total Staff',
      value: staffExcludingOwner.length.toString(),
      icon: PeopleRoundedIcon,
      iconColor: '#6B4C2A',
      iconBg: 'rgba(107,76,42,0.16)',
    },
    {
      id: 'staff-active',
      label: 'Active Staff',
      value: activeStaff.toString(),
      icon: PersonAddAlt1RoundedIcon,
      iconColor: '#166534',
      iconBg: '#DCFCE7',
    },
    {
      id: 'staff-inactive',
      label: 'Inactive Staff',
      value: inactiveStaff.toString(),
      icon: BlockRoundedIcon,
      iconColor: '#991B1B',
      iconBg: '#FEE2E2',
    },
    {
      id: 'staff-leads',
      label: 'Leads and Supervisors',
      value: leadEmployees.toString(),
      icon: TrendingUpRoundedIcon,
      iconColor: '#854D0E',
      iconBg: '#FEF9C3',
    },
  ];
};

const buildActivityKpis = ({ activityLogs }: BranchKpiContext): BranchProfileKpi[] => {
  const successful = activityLogs.filter((log) => log.outcome === 'successful').length;
  const pending = activityLogs.filter((log) => log.outcome === 'pending').length;
  const flagged = activityLogs.filter((log) => log.outcome === 'flagged').length;

  return [
    {
      id: 'activity-total',
      label: 'Total Events',
      value: activityLogs.length.toString(),
      icon: AnalyticsRoundedIcon,
      iconColor: '#1D4ED8',
      iconBg: '#DBEAFE',
    },
    {
      id: 'activity-successful',
      label: 'Successful',
      value: successful.toString(),
      icon: CheckCircleRoundedIcon,
      iconColor: '#166534',
      iconBg: '#DCFCE7',
    },
    {
      id: 'activity-pending',
      label: 'Pending',
      value: pending.toString(),
      icon: ReceiptLongRoundedIcon,
      iconColor: '#92400E',
      iconBg: '#FEF3C7',
    },
    {
      id: 'activity-flagged',
      label: 'Flagged',
      value: flagged.toString(),
      icon: WarningAmberRoundedIcon,
      iconColor: '#991B1B',
      iconBg: '#FEE2E2',
    },
  ];
};

const buildTransactionKpis = ({ transactions }: BranchKpiContext): BranchProfileKpi[] => {
  const stockIn = transactions.filter((transaction) => transaction.type === 'Stock-In').length;
  const stockOut = transactions.filter((transaction) => transaction.type === 'Stock-Out').length;
  const netMovement = transactions.reduce((total, transaction) => total + transaction.netChange, 0);

  return [
    {
      id: 'transactions-total',
      label: 'Total Entries',
      value: transactions.length.toString(),
      icon: ReceiptLongRoundedIcon,
      iconColor: '#6B4C2A',
      iconBg: 'rgba(107,76,42,0.16)',
    },
    {
      id: 'transactions-stock-in',
      label: 'Stock-In',
      value: stockIn.toString(),
      icon: TrendingUpRoundedIcon,
      iconColor: '#166534',
      iconBg: '#DCFCE7',
    },
    {
      id: 'transactions-stock-out',
      label: 'Stock-Out',
      value: stockOut.toString(),
      icon: WarningAmberRoundedIcon,
      iconColor: '#B91C1C',
      iconBg: '#FEE2E2',
    },
    {
      id: 'transactions-net',
      label: 'Net Qty Movement',
      value: `${netMovement >= 0 ? '+' : ''}${netMovement}`,
      icon: AnalyticsRoundedIcon,
      iconColor: '#1D4ED8',
      iconBg: '#DBEAFE',
    },
  ];
};

const buildInventoryKpis = ({ inventoryItems }: BranchKpiContext): BranchProfileKpi[] => {
  const lowStock = inventoryItems.filter((item) => item.status === 'low-stock').length;
  const outOfStock = inventoryItems.filter((item) => item.status === 'out-of-stock').length;
  const suppliers = new Set(inventoryItems.map((item) => item.supplier)).size;

  return [
    {
      id: 'inventory-total',
      label: 'Tracked Items',
      value: inventoryItems.length.toString(),
      icon: Inventory2RoundedIcon,
      iconColor: '#6B4C2A',
      iconBg: 'rgba(107,76,42,0.16)',
    },
    {
      id: 'inventory-low',
      label: 'Low Stock',
      value: lowStock.toString(),
      icon: WarningAmberRoundedIcon,
      iconColor: '#B45309',
      iconBg: '#FEF3C7',
    },
    {
      id: 'inventory-out',
      label: 'Out of Stock',
      value: outOfStock.toString(),
      icon: BlockRoundedIcon,
      iconColor: '#B91C1C',
      iconBg: '#FEE2E2',
    },
    {
      id: 'inventory-suppliers',
      label: 'Suppliers',
      value: suppliers.toString(),
      icon: SearchRoundedIcon,
      iconColor: '#1D4ED8',
      iconBg: '#DBEAFE',
    },
  ];
};

const buildMenuKpis = ({ menuItems }: BranchKpiContext): BranchProfileKpi[] => {
  const active = menuItems.filter((m) => m.status === 'Active').length;
  const inactive = menuItems.filter((m) => m.status === 'Inactive').length;
  const outOfStock = menuItems.filter((m) => m.status === 'Out of Stock').length;

  return [
    {
      id: 'menu-total',
      label: 'Total Menu Items',
      value: menuItems.length.toString(),
      icon: LocalCafeRoundedIcon,
      iconColor: '#6B4C2A',
      iconBg: 'rgba(107,76,42,0.16)',
    },
    {
      id: 'menu-active',
      label: 'Active',
      value: active.toString(),
      icon: CheckCircleRoundedIcon,
      iconColor: '#166534',
      iconBg: '#DCFCE7',
    },
    {
      id: 'menu-inactive',
      label: 'Inactive',
      value: inactive.toString(),
      icon: BlockRoundedIcon,
      iconColor: '#991B1B',
      iconBg: '#FEE2E2',
    },
    {
      id: 'menu-oos',
      label: 'Out of Stock',
      value: outOfStock.toString(),
      icon: WarningAmberRoundedIcon,
      iconColor: '#B45309',
      iconBg: '#FEF3C7',
    },
  ];
};

export const getKpisForTab = (activeTab: BranchProfileTabKey, context: BranchKpiContext): BranchProfileKpi[] => {
  switch (activeTab) {
    case 'staff':
      return buildStaffKpis(context);
    case 'activity':
      return buildActivityKpis(context);
    case 'transactions':
      return buildTransactionKpis(context);
    case 'inventory':
      return buildInventoryKpis(context);
    case 'menu':
      return buildMenuKpis(context);
    case 'details':
    default:
      return buildDetailsKpis(context);
  }
};
