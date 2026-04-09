import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, TablePagination, Typography } from '@mui/material';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

export interface ColumnDef<T> {
  key: string;
  label: string;
  gridWidth?: string | number;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | null | undefined;
  render: (row: T) => React.ReactNode;
}

export interface QuickFilter {
  value: string;
  label: string;
}

export interface DataTableProps<T> {
  title?: React.ReactNode;
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  defaultPageSize?: number;
  defaultRowsPerPage?: number;
  pageSizes?: number[];
  rowsPerPageOptions?: number[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  quickFilters?: QuickFilter[];
  activeQuickFilter?: string;
  onQuickFilterChange?: (value: string) => void;
  rightAction?: React.ReactNode;
  striped?: boolean;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T>({
  title,
  data,
  columns,
  keyExtractor,
  defaultPageSize = 5,
  defaultRowsPerPage,
  pageSizes = [5, 10, 25],
  rowsPerPageOptions,
  emptyMessage = 'No records found.',
  onRowClick,
  toolbar,
  quickFilters,
  activeQuickFilter = '',
  onQuickFilterChange,
  rightAction,
  striped = false,
  className,
}: DataTableProps<T>) {
  const effectiveDefaultPageSize = defaultRowsPerPage ?? defaultPageSize;
  const effectivePageSizes = rowsPerPageOptions ?? pageSizes;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(effectiveDefaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    setRowsPerPage(effectiveDefaultPageSize);
  }, [effectiveDefaultPageSize]);

  useEffect(() => {
    setPage(0);
  }, [activeQuickFilter]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable) {
      return;
    }

    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortKey(null);
      setSortDirection(null);
    }

    setPage(0);
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return data;
    }

    const column = columns.find((candidate) => candidate.key === sortKey);

    if (!column) {
      return data;
    }

    const getComparableValue = (row: T): string | number => {
      const rawValue = column.sortAccessor
        ? column.sortAccessor(row)
        : (row as Record<string, unknown>)[sortKey];

      if (typeof rawValue === 'number') {
        return rawValue;
      }

      if (rawValue === null || rawValue === undefined) {
        return '';
      }

      return String(rawValue).toLowerCase();
    };

    return [...data].sort((left, right) => {
      const leftValue = getComparableValue(left);
      const rightValue = getComparableValue(right);

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortDirection === 'asc'
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue));
    });
  }, [columns, data, sortDirection, sortKey]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(sortedData.length / rowsPerPage) - 1);

    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, rowsPerPage, sortedData.length]);

  const gridTemplateColumns = columns
    .map((column) => {
      const widthToken = column.gridWidth ?? column.width;

      if (typeof widthToken === 'number') {
        return `${widthToken}px`;
      }

      return widthToken || '1fr';
    })
    .join(' ');
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const showPagination = sortedData.length > 0;

  const getAlign = (align?: ColumnDef<T>['align']) => {
    if (!align || align === 'left') {
      return 'flex-start';
    }

    if (align === 'center') {
      return 'center';
    }

    return 'flex-end';
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey || sortDirection === null) {
      return <UnfoldMoreRoundedIcon sx={{ fontSize: 14, opacity: 0.35, ml: 0.4, verticalAlign: 'middle' }} />;
    }

    if (sortDirection === 'asc') {
      return <KeyboardArrowUpRoundedIcon sx={{ fontSize: 14, opacity: 0.75, ml: 0.4, verticalAlign: 'middle', color: 'primary.main' }} />;
    }

    return <KeyboardArrowDownRoundedIcon sx={{ fontSize: 14, opacity: 0.75, ml: 0.4, verticalAlign: 'middle', color: 'primary.main' }} />;
  };

  const hasQuickFilterBar = (quickFilters && quickFilters.length > 0) || rightAction;

  return (
    <Box
      sx={{
        minWidth: 0,
      }}
    >
      {toolbar ? <Box sx={{ mb: 2.5 }}>{toolbar}</Box> : null}

      <Box
        className={className || 'glass-card'}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
      {/* Header */}
      {title ? (
        <Box
          sx={{
            px: 3,
            py: 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>
            {title}
          </Typography>
        </Box>
      ) : null}

      {hasQuickFilterBar ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.2,
            px: 2.5,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            flexWrap: 'wrap',
          }}
        >
          {quickFilters && quickFilters.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.9 }}>
              <Chip
                label="All"
                size="small"
                onClick={() => onQuickFilterChange?.('')}
                sx={{
                  height: 28,
                  borderRadius: 1.5,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  ...(activeQuickFilter === ''
                    ? {
                        bgcolor: '#6B4C2A',
                        color: '#fff',
                        '&:hover': { bgcolor: '#5A3E23' },
                      }
                    : {
                        bgcolor: 'transparent',
                        color: 'text.secondary',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'text.secondary', color: 'text.primary' },
                      }),
                }}
              />

              {quickFilters.map((quickFilter) => {
                const isActive = activeQuickFilter === quickFilter.value;

                return (
                  <Chip
                    key={quickFilter.value}
                    label={quickFilter.label}
                    size="small"
                    onClick={() => onQuickFilterChange?.(isActive ? '' : quickFilter.value)}
                    sx={{
                      height: 28,
                      borderRadius: 1.5,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      ...(isActive
                        ? {
                            bgcolor: '#6B4C2A',
                            color: '#fff',
                            '&:hover': { bgcolor: '#5A3E23' },
                          }
                        : {
                            bgcolor: 'transparent',
                            color: 'text.secondary',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { borderColor: 'text.secondary', color: 'text.primary' },
                          }),
                    }}
                  />
                );
              })}
            </Box>
          ) : (
            <Box />
          )}

          {rightAction ? <Box>{rightAction}</Box> : null}
        </Box>
      ) : null}

      {/* Table header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns,
          px: 3,
          py: 1,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {columns.map((col) => (
          <Typography
            key={col.key}
            onClick={col.sortable ? () => handleSort(col) : undefined}
            sx={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: sortKey === col.key ? 'primary.main' : 'text.secondary',
              textAlign: col.align || 'left',
              userSelect: 'none',
              cursor: col.sortable ? 'pointer' : 'default',
              transition: 'color 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: getAlign(col.align),
              '&:hover': col.sortable ? { color: 'text.primary' } : undefined,
            }}
          >
            {col.label}
            {col.sortable ? <SortIcon columnKey={col.key} /> : null}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      {paginatedData.length > 0 ? (
        paginatedData.map((row, rowIndex) => (
          <Box
            key={keyExtractor(row)}
            className="hover-lift"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            sx={{
              display: 'grid',
              gridTemplateColumns,
              px: 3,
              py: 1.75,
              alignItems: 'center',
              bgcolor: striped && rowIndex % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent',
              borderBottom: 1,
              borderColor: 'divider',
              cursor: onRowClick ? 'pointer' : 'default',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {columns.map((col) => (
              <Box key={col.key} sx={{ display: 'flex', justifyContent: getAlign(col.align) }}>
                {col.render(row)}
              </Box>
            ))}
          </Box>
        ))
      ) : (
        <Box
          sx={{
            px: 3,
            py: 8,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>
            {emptyMessage}
          </Typography>
        </Box>
      )}

      {/* Pagination component from MUI */}
      {showPagination ? (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={effectivePageSizes}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      ) : null}
      </Box>
    </Box>
  );
}
