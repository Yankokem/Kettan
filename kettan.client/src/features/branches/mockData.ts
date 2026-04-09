import type { Branch, BranchEmployee, BranchUserOption } from './types';

const createBranchImage = (label: string, backgroundColor: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='${backgroundColor}'/><text x='50%' y='54%' text-anchor='middle' dominant-baseline='middle' font-family='Segoe UI, sans-serif' font-size='74' font-weight='700' fill='#FFFFFF'>${label}</text></svg>`
  )}`;

export const BRANCH_OWNER_OPTIONS: BranchUserOption[] = [
  { value: '11', label: 'Patricia Lim' },
  { value: '12', label: 'Marco Reyes' },
  { value: '13', label: 'Lia Tan' },
];

export const BRANCH_MANAGER_OPTIONS: BranchUserOption[] = [
  { value: '1', label: 'Sarah Jenkins' },
  { value: '2', label: 'Miguel Santos' },
  { value: '3', label: 'Anna Cruz' },
  { value: '4', label: 'Kevin Flores' },
];

export const BRANCHES_MOCK: Branch[] = [
  {
    id: 1,
    name: 'Makati HQ',
    address: '120 Ayala Triangle',
    city: 'Makati City',
    contactNumber: '+63 917 801 4101',
    openTime: '07:00',
    closeTime: '22:00',
    ownerUserId: '11',
    owner: 'Patricia Lim',
    managerUserId: '1',
    manager: 'Sarah Jenkins',
    staff: 14,
    status: 'active',
    lowStockItems: 2,
    totalItems: 140,
    notes: 'Flagship store with dual-shift operations.',
    imageUrl: createBranchImage('MH', '#6B4C2A'),
  },
  {
    id: 2,
    name: 'BGC High Street',
    address: '5th Avenue High Street Central',
    city: 'Taguig City',
    contactNumber: '+63 917 612 8842',
    openTime: '08:00',
    closeTime: '23:00',
    ownerUserId: '12',
    owner: 'Marco Reyes',
    managerUserId: '2',
    manager: 'Miguel Santos',
    staff: 8,
    status: 'active',
    lowStockItems: 5,
    totalItems: 110,
    notes: 'Peak demand branch with frequent late-night traffic.',
    imageUrl: createBranchImage('BG', '#546B3F'),
  },
  {
    id: 3,
    name: 'Ortigas Center',
    address: 'Emerald Avenue Corner Garnet Road',
    city: 'Pasig City',
    contactNumber: '+63 917 455 2056',
    openTime: '07:00',
    closeTime: '21:00',
    ownerUserId: '13',
    owner: 'Lia Tan',
    managerUserId: '3',
    manager: 'Anna Cruz',
    staff: 6,
    status: 'active',
    lowStockItems: 0,
    totalItems: 95,
    notes: 'Balanced demand profile, stable inventory turnover.',
  },
  {
    id: 4,
    name: 'Quezon City Circle',
    address: 'Tomas Morato Avenue',
    city: 'Quezon City',
    contactNumber: '+63 917 389 9921',
    openTime: '08:00',
    closeTime: '20:00',
    ownerUserId: '',
    owner: undefined,
    managerUserId: '',
    manager: 'Pending Assignment',
    staff: 0,
    status: 'setup',
    lowStockItems: 0,
    totalItems: 0,
    notes: 'Site setup in progress, user assignments pending.',
  },
];

const BRANCH_EMPLOYEE_ROSTERS: Record<number, BranchEmployee[]> = {
  1: [
    {
      id: 1001,
      branchId: 1,
      firstName: 'Jasper',
      lastName: 'Mendoza',
      position: 'Shift Lead',
      contactNumber: '+63 917 771 2101',
      dateHired: '2025-02-10',
      isActive: true,
    },
    {
      id: 1002,
      branchId: 1,
      firstName: 'Paula',
      lastName: 'Santos',
      position: 'Barista',
      contactNumber: '+63 917 770 1993',
      dateHired: '2025-07-21',
      isActive: true,
    },
    {
      id: 1003,
      branchId: 1,
      firstName: 'Rico',
      lastName: 'Delos Reyes',
      position: 'Cashier',
      contactNumber: '+63 917 553 1329',
      dateHired: '2024-12-04',
      isActive: false,
    },
  ],
  2: [
    {
      id: 2001,
      branchId: 2,
      firstName: 'Ivy',
      lastName: 'Garcia',
      position: 'Shift Lead',
      contactNumber: '+63 917 824 6112',
      dateHired: '2025-03-15',
      isActive: true,
    },
    {
      id: 2002,
      branchId: 2,
      firstName: 'Nikko',
      lastName: 'Panganiban',
      position: 'Barista',
      contactNumber: '+63 917 113 4980',
      dateHired: '2025-08-29',
      isActive: true,
    },
    {
      id: 2003,
      branchId: 2,
      firstName: 'Ella',
      lastName: 'Ramos',
      position: 'Cashier',
      contactNumber: '+63 917 922 7446',
      dateHired: '2025-11-10',
      isActive: true,
    },
  ],
  3: [
    {
      id: 3001,
      branchId: 3,
      firstName: 'Mina',
      lastName: 'Torres',
      position: 'Barista',
      contactNumber: '+63 917 661 0284',
      dateHired: '2024-09-17',
      isActive: true,
    },
    {
      id: 3002,
      branchId: 3,
      firstName: 'Carlo',
      lastName: 'Yu',
      position: 'Shift Lead',
      contactNumber: '+63 917 445 9082',
      dateHired: '2025-01-06',
      isActive: true,
    },
  ],
  4: [],
};

export const getBranchById = (branchId: number): Branch | undefined =>
  BRANCHES_MOCK.find((branch) => branch.id === branchId);

export const getBranchEmployeesById = (branchId: number): BranchEmployee[] =>
  BRANCH_EMPLOYEE_ROSTERS[branchId] ?? [];
