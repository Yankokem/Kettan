import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, TablePagination, Typography, alpha } from '@mui/material';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { EmptyState } from './EmptyState';

export interface ColumnDef<T> {
  key: string;
  label: string;
  gridWidth?: string | number;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | null | undefined;
  render: (row: T, index: number) => React.ReactNode;
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
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  quickFilters?: QuickFilter[];
  activeQuickFilter?: string;
  onQuickFilterChange?: (value: string) => void;
  quickFilterStyle?: 'brand' | 'default';
  rightAction?: React.ReactNode;
  striped?: boolean;
  className?: string;
  rowSx?: (row: T, index: number) => any;
  isLoading?: boolean;
  fulfillment?: boolean;
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
  emptyTitle = 'No results found',
  emptyMessage = 'No records match the current criteria.',
  emptyIcon,
  onRowClick,
  toolbar,
  quickFilters,
  activeQuickFilter = '',
  onQuickFilterChange,
  quickFilterStyle = 'brand',
  rightAction,
  striped = false,
  className,
  rowSx,
  isLoading = false,
  fulfillment = false,
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

  const getQuickFilterSx = (isActive: boolean) => {
    if (quickFilterStyle === 'default') {
      return {
        bgcolor: isActive ? 'action.selected' : 'transparent',
        color: isActive ? 'text.primary' : 'text.secondary',
        border: '1px solid',
        borderColor: isActive ? 'text.disabled' : 'divider',
        '&:hover': {
          borderColor: 'text.secondary',
          color: 'text.primary',
          bgcolor: isActive ? 'action.selected' : 'action.hover',
        },
      };
    }

    return isActive
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
        };
  };

  return (
    <Box
      sx={{
        minWidth: 0,
      }}
    >
      {toolbar ? <Box sx={{ mb: 2.5 }}>{toolbar}</Box> : null}

      <Box
        className={fulfillment ? undefined : (className || 'glass-card')}
        sx={{
          height: fulfillment ? 'auto' : '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: fulfillment ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
          border: fulfillment ? '1px solid' : undefined,
          borderColor: fulfillment ? 'divider' : undefined,
          bgcolor: 'background.paper',
          pb: fulfillment ? 2 : 0,
        }}
      >
      {/* Header */}
      {title ? (
        <Box
          sx={{
            px: fulfillment ? 2 : 3,
            py: fulfillment ? 2 : 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: fulfillment 
              ? 'linear-gradient(170deg, #F0E6D3 0%, #FAF5EF 100%)'
              : (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(170deg, rgba(46, 31, 20, 0.96) 0%, rgba(58, 39, 24, 0.92) 100%)'
                    : 'linear-gradient(170deg, rgba(250, 245, 239, 0.98) 0%, rgba(240, 230, 211, 0.98) 100%)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {typeof title === 'string' ? (
            <Typography sx={{ 
              fontSize: fulfillment ? 12 : 15, 
              fontWeight: 700, 
              color: fulfillment ? '#6B4C2A' : (theme) => (theme.palette.mode === 'dark' ? '#E8D3A9' : '#2E1F0C'), 
              letterSpacing: fulfillment ? '0.05em' : '-0.01em',
              textTransform: fulfillment ? 'uppercase' : 'none'
            }}>
              {title}
            </Typography>
          ) : (
            title
          )}
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
                  ...getQuickFilterSx(activeQuickFilter === ''),
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
                      ...getQuickFilterSx(isActive),
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
          columnGap: 2,
          px: fulfillment ? 2.5 : 3,
          py: fulfillment ? 1.5 : 1.3,
          position: 'relative',
          background: fulfillment 
            ? 'transparent'
            : (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(170deg, rgba(46, 31, 20, 0.9) 0%, rgba(58, 39, 24, 0.86) 100%)'
                  : 'linear-gradient(170deg, rgba(250, 245, 239, 0.94) 0%, rgba(240, 230, 211, 0.94) 100%)',
          '&::after': fulfillment ? {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 20,
            right: 20,
            height: '2px',
            bgcolor: alpha('#6B4C2A', 0.5),
          } : {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgcolor: alpha('#6B4C2A', 0.12),
          }
        }}
      >
        {columns.map((col) => (
          <Typography
            key={col.key}
            onClick={col.sortable ? () => handleSort(col) : undefined}
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              px: 0.5,
              color: (theme) =>
                sortKey === col.key
                  ? theme.palette.primary.main
                  : '#6B4C2A',
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
      {isLoading ? (
        Array.from({ length: effectiveDefaultPageSize }).map((_, idx) => (
          <Box
            key={`skeleton-${idx}`}
            sx={{
              display: 'grid',
              gridTemplateColumns,
              columnGap: 2,
              px: 3,
              py: 2,
              borderBottom: fulfillment ? '1px dashed' : 1,
              borderColor: fulfillment ? alpha('#C9A84C', 0.4) : 'divider',
            }}
          >
            {columns.map((col) => (
              <Box key={col.key} sx={{ px: 0.5 }}>
                <Box className="skeleton" sx={{ height: 16, width: '80%', borderRadius: 1 }} />
              </Box>
            ))}
          </Box>
        ))
      ) : paginatedData.length > 0 ? (
        paginatedData.map((row, rowIndex) => (
          <Box
            key={keyExtractor(row)}
            className="hover-lift"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            sx={{
              display: 'grid',
              gridTemplateColumns,
              columnGap: 2,
              px: fulfillment ? 2.5 : 3,
              py: fulfillment ? 1.75 : 1.75,
              alignItems: 'center',
              position: 'relative',
              bgcolor: striped && rowIndex % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
              ...(rowSx ? rowSx(row, rowIndex) : {}),
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: fulfillment ? 20 : 0,
                right: fulfillment ? 20 : 0,
                height: '1px',
                borderBottom: fulfillment ? '1px dashed' : '1px solid',
                borderColor: alpha('#6B4C2A', 0.1),
              }
            }}
          >
            {columns.map((col) => (
              <Box key={col.key} sx={{ display: 'flex', justifyContent: getAlign(col.align), px: 0.5 }}>
                {col.render(row, page * rowsPerPage + rowIndex)}
              </Box>
            ))}
          </Box>
        ))
      ) : (
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          icon={emptyIcon}
          minHeight={280}
        />
      )}

      {/* Pagination component from MUI */}
      {showPagination && !fulfillment ? (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={effectivePageSizes}
          sx={{ 
            borderTop: '1px solid', 
            borderColor: alpha('#6B4C2A', 0.12),
            color: '#6B4C2A',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: 13.5,
              fontWeight: 600,
              color: '#6B4C2A',
            },
            '& .MuiTablePagination-select': {
              fontSize: 13.5,
              fontWeight: 700,
              color: '#6B4C2A',
            },
            '& .MuiIconButton-root': {
              color: '#6B4C2A',
            },
            '& .MuiIconButton-root.Mui-disabled': {
              color: alpha('#6B4C2A', 0.3),
            },
          }}
        />
      ) : null}
      </Box>
    </Box>
  );
}
