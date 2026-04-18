import { MOCK_CATEGORIES } from './mockData';
import type { InventoryCategory, ItemCategoryFormData } from './types';

const STORAGE_KEY = 'kettan.inventory.categories.v1';

const SEED_ITEM_CATEGORIES: InventoryCategory[] = MOCK_CATEGORIES.map((category) => ({
  ...category,
  isDeleted: category.isDeleted ?? false,
  deletedAt: category.deletedAt ?? null,
  createdAt: category.createdAt ?? '2026-03-01T08:00:00Z',
}));

function hasWindow() {
  return typeof window !== 'undefined';
}

function readStore(): InventoryCategory[] {
  if (!hasWindow()) {
    return [...SEED_ITEM_CATEGORIES];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEM_CATEGORIES));
    return [...SEED_ITEM_CATEGORIES];
  }

  try {
    const parsed = JSON.parse(raw) as InventoryCategory[];
    return Array.isArray(parsed) ? parsed : [...SEED_ITEM_CATEGORIES];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEM_CATEGORIES));
    return [...SEED_ITEM_CATEGORIES];
  }
}

function writeStore(rows: InventoryCategory[]) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function sortRows(rows: InventoryCategory[]) {
  return [...rows].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
}

function makeId() {
  return `ic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function listItemCategories(options?: { includeDeleted?: boolean }): InventoryCategory[] {
  const includeDeleted = options?.includeDeleted ?? false;
  const rows = readStore();
  const visibleRows = includeDeleted ? rows : rows.filter((row) => !row.isDeleted);
  return sortRows(visibleRows);
}

export function createItemCategory(input: ItemCategoryFormData): InventoryCategory {
  const rows = readStore();

  const created: InventoryCategory = {
    id: makeId(),
    name: input.name.trim(),
    description: input.description.trim() || undefined,
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

export function updateItemCategory(categoryId: string, input: ItemCategoryFormData): InventoryCategory | null {
  const rows = readStore();
  const index = rows.findIndex((row) => row.id === categoryId);

  if (index < 0) {
    return null;
  }

  const updated: InventoryCategory = {
    ...rows[index],
    name: input.name.trim(),
    description: input.description.trim() || undefined,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
  };

  const nextRows = [...rows];
  nextRows[index] = updated;
  writeStore(sortRows(nextRows));
  return updated;
}

export function softDeleteItemCategory(categoryId: string): InventoryCategory | null {
  const rows = readStore();
  const index = rows.findIndex((row) => row.id === categoryId);

  if (index < 0) {
    return null;
  }

  const deleted: InventoryCategory = {
    ...rows[index],
    isDeleted: true,
    deletedAt: new Date().toISOString(),
  };

  const nextRows = [...rows];
  nextRows[index] = deleted;
  writeStore(nextRows);
  return deleted;
}
