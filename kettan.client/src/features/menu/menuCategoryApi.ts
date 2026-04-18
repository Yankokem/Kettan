import type { MenuCategory, MenuCategoryFormData } from './types';

const STORAGE_KEY = 'kettan.menu.categories.v1';

const SEED_MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'mc-1',
    name: 'Coffee',
    displayOrder: 1,
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mc-2',
    name: 'Coffee with Milk',
    displayOrder: 2,
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-03-01T08:10:00Z',
  },
  {
    id: 'mc-3',
    name: 'Tea',
    displayOrder: 3,
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-03-01T08:20:00Z',
  },
  {
    id: 'mc-4',
    name: 'Pastry',
    displayOrder: 4,
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-03-01T08:30:00Z',
  },
];

function hasWindow() {
  return typeof window !== 'undefined';
}

function readStore(): MenuCategory[] {
  if (!hasWindow()) {
    return [...SEED_MENU_CATEGORIES];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MENU_CATEGORIES));
    return [...SEED_MENU_CATEGORIES];
  }

  try {
    const parsed = JSON.parse(raw) as MenuCategory[];
    return Array.isArray(parsed) ? parsed : [...SEED_MENU_CATEGORIES];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MENU_CATEGORIES));
    return [...SEED_MENU_CATEGORIES];
  }
}

function writeStore(rows: MenuCategory[]) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function sortRows(rows: MenuCategory[]) {
  return [...rows].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
}

function makeId() {
  return `mc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function listMenuCategories(options?: { includeDeleted?: boolean }): MenuCategory[] {
  const includeDeleted = options?.includeDeleted ?? false;
  const rows = readStore();
  const visibleRows = includeDeleted ? rows : rows.filter((row) => !row.isDeleted);
  return sortRows(visibleRows);
}

export function createMenuCategory(input: MenuCategoryFormData): MenuCategory {
  const rows = readStore();

  const created: MenuCategory = {
    id: makeId(),
    name: input.name.trim(),
    displayOrder: input.displayOrder,
    isActive: input.isActive,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };

  const nextRows = sortRows([...rows, created]);
  writeStore(nextRows);
  return created;
}

export function updateMenuCategory(categoryId: string, input: MenuCategoryFormData): MenuCategory | null {
  const rows = readStore();
  const index = rows.findIndex((row) => row.id === categoryId);

  if (index < 0) {
    return null;
  }

  const updated: MenuCategory = {
    ...rows[index],
    name: input.name.trim(),
    displayOrder: input.displayOrder,
    isActive: input.isActive,
  };

  const nextRows = [...rows];
  nextRows[index] = updated;
  writeStore(sortRows(nextRows));
  return updated;
}

export function softDeleteMenuCategory(categoryId: string): MenuCategory | null {
  const rows = readStore();
  const index = rows.findIndex((row) => row.id === categoryId);

  if (index < 0) {
    return null;
  }

  const deleted: MenuCategory = {
    ...rows[index],
    isDeleted: true,
    deletedAt: new Date().toISOString(),
  };

  const nextRows = [...rows];
  nextRows[index] = deleted;
  writeStore(nextRows);
  return deleted;
}
