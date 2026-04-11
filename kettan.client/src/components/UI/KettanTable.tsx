import React from 'react';
import { DataTable, type ColumnDef, type QuickFilter } from './DataTable';

export type KettanColumnDef<T> = ColumnDef<T>;

export interface KettanTableProps<T> {
  columns: KettanColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  toolbar?: React.ReactNode;
  quickFilters?: QuickFilter[];
  activeQuickFilter?: string;
  onQuickFilterChange?: (value: string) => void;
  rightAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  striped?: boolean;
}

export function KettanTable<T>({
  columns,
  data,
  keyExtractor,
  toolbar,
  quickFilters,
  activeQuickFilter,
  onQuickFilterChange,
  rightAction,
  onRowClick,
  emptyMessage,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
  striped = false,
}: KettanTableProps<T>) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={keyExtractor}
      toolbar={toolbar}
      quickFilters={quickFilters}
      activeQuickFilter={activeQuickFilter}
      onQuickFilterChange={onQuickFilterChange}
      rightAction={rightAction}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
      defaultRowsPerPage={defaultRowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      striped={striped}
    />
  );
}
