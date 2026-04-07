import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KettanColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
  render: (row: T) => React.ReactNode;
}

export interface QuickFilter {
  value: string;
  label: string;
}

export interface KettanTableProps<T> {
  /** Column definitions */
  columns: KettanColumnDef<T>[];
  /** Full data array */
  data: T[];
  /** Unique key per row */
  keyExtractor: (row: T) => string;
  /** Optional toolbar rendered ABOVE the card (search, global filters, actions) */
  toolbar?: React.ReactNode;
  /** Quick-filter chip list rendered INSIDE the card at the top */
  quickFilters?: QuickFilter[];
  /** Currently selected quick-filter value — use '' for "All" */
  activeQuickFilter?: string;
  /** Called when a quick-filter chip is clicked */
  onQuickFilterChange?: (value: string) => void;
  /** Optional element shown on the right side of the quick-filter bar (e.g. a dropdown) */
  rightAction?: React.ReactNode;
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Message shown when there is no data */
  emptyMessage?: string;
  /** Default rows per page (default: 10) */
  defaultRowsPerPage?: number;
  /** Rows-per-page options */
  rowsPerPageOptions?: number[];
  /** Subtle zebra striping on every other row */
  striped?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

// ── Component ─────────────────────────────────────────────────────────────────

export function KettanTable<T>({
  columns,
  data,
  keyExtractor,
  toolbar,
  quickFilters,
  activeQuickFilter = '',
  onQuickFilterChange,
  rightAction,
  onRowClick,
  emptyMessage = 'No data to display.',
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
  striped = false,
}: KettanTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Reset to page 0 when quick filter changes externally
  React.useEffect(() => { setPage(0); }, [activeQuickFilter]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const handleSort = (colKey: string) => {
    if (sortKey !== colKey) {
      setSortKey(colKey);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
    setPage(0);
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase())
        : String(bVal).toLowerCase().localeCompare(String(aVal).toLowerCase());
    });
  }, [data, sortKey, sortDir]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startItem = totalItems === 0 ? 0 : page * rowsPerPage + 1;
  const endItem = Math.min((page + 1) * rowsPerPage, totalItems);
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageChange = (_e: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
  };

  const handleRowsPerPageChange = (e: SelectChangeEvent<number>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(0);
  };

  // ── Sort icon ─────────────────────────────────────────────────────────────
  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey || sortDir === null)
      return <UnfoldMoreRoundedIcon sx={{ fontSize: 14, opacity: 0.3, ml: 0.4, verticalAlign: 'middle' }} />;
    if (sortDir === 'asc')
      return <KeyboardArrowUpRoundedIcon sx={{ fontSize: 14, opacity: 0.75, ml: 0.4, verticalAlign: 'middle', color: 'primary.main' }} />;
    return <KeyboardArrowDownRoundedIcon sx={{ fontSize: 14, opacity: 0.75, ml: 0.4, verticalAlign: 'middle', color: 'primary.main' }} />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Toolbar: outside the card (search bar, global actions, etc.) */}
      {toolbar && <Box sx={{ mb: 2.5 }}>{toolbar}</Box>}

      {/* ── Card ── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 420,
        }}
      >
        {/* ── Quick-filter chip bar (inside card) ── */}
        {quickFilters && quickFilters.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              px: 2.5,
              py: 1.75,
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap',
            }}
          >
            {/* Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* "All" chip */}
              <Chip
                label="All"
                size="small"
                onClick={() => onQuickFilterChange?.('')}
                sx={{
                  height: 32,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: '9px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  ...(activeQuickFilter === ''
                    ? {
                        bgcolor: '#6B4C2A',
                        color: '#fff',
                        '&:hover': { bgcolor: '#5a3e23' },
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
              {quickFilters.map((f) => {
                const isActive = activeQuickFilter === f.value;
                return (
                  <Chip
                    key={f.value}
                    label={f.label}
                    size="small"
                    onClick={() => onQuickFilterChange?.(isActive ? '' : f.value)}
                    sx={{
                      height: 32,
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: '9px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      ...(isActive
                        ? {
                            bgcolor: '#6B4C2A',
                            color: '#fff',
                            '&:hover': { bgcolor: '#5a3e23' },
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

            {/* Optional right-side action (e.g. filter dropdown) */}
            {rightAction && <Box>{rightAction}</Box>}
          </Box>
        )}

        {/* If no quickFilters but rightAction still exists, show it in its own bar */}
        {!quickFilters && rightAction && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              px: 2.5,
              py: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {rightAction}
          </Box>
        )}

        {/* ── Table ── */}
        <TableContainer sx={{ flex: 1 }}>
          <Table sx={{ minWidth: 400 }}>
            {/* Header */}
            <TableHead>
              <TableRow
                sx={{
                  background: 'linear-gradient(135deg, #FDF6EC 0%, #FAF0DC 100%)',
                  borderBottom: '1.5px solid',
                  borderColor: 'divider',
                }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align ?? 'left'}
                    width={col.width}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    sx={{
                      py: 1.5,
                      px: 2.5,
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: sortKey === col.key ? 'primary.main' : 'text.disabled',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      cursor: col.sortable ? 'pointer' : 'default',
                      transition: 'color 0.15s',
                      borderBottom: 0,
                      ...(col.sortable && { '&:hover': { color: 'text.secondary' } }),
                    }}
                  >
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* Body */}
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={{ py: 6, color: 'text.disabled', fontSize: 13.5, fontStyle: 'italic', border: 0 }}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <TableRow
                    key={keyExtractor(row)}
                    hover={!!onRowClick}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.12s',
                      '&:last-child td': { border: 0 },
                      ...(striped && rowIndex % 2 === 1 && { bgcolor: 'rgba(0,0,0,0.015)' }),
                      '&:hover': onRowClick
                        ? { bgcolor: 'rgba(107, 76, 42, 0.035)' }
                        : {},
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        align={col.align ?? 'left'}
                        width={col.width}
                        sx={{ py: 2.25, px: 2.5, borderColor: 'divider' }}
                      >
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Pagination footer (inside the card) ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          {/* Left: rows per page */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
                Rows per page:
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                size="small"
                sx={{
                  fontSize: 12.5,
                  height: 28,
                  '& .MuiSelect-select': { py: 0, pl: 1.25, pr: '24px !important', fontWeight: 600 },
                  '& fieldset': { borderColor: 'divider', borderRadius: 1.5 },
                }}
              >
                {rowsPerPageOptions.map((opt) => (
                  <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Showing X–Y of Z */}
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              Showing{' '}
              <Typography component="span" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 12.5 }}>
                {startItem}–{endItem}
              </Typography>{' '}
              of{' '}
              <Typography component="span" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 12.5 }}>
                {totalItems}
              </Typography>
            </Typography>
          </Box>

          {/* Right: page numbers */}
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={handlePageChange}
            size="small"
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: 12.5,
                fontWeight: 600,
                height: 28,
                minWidth: 28,
                color: 'text.secondary',
                borderRadius: '6px',
                '&.Mui-selected': {
                  bgcolor: '#6B4C2A',
                  color: '#fff',
                  '&:hover': { bgcolor: '#5a3e23' },
                },
                '&:hover': {
                  bgcolor: 'rgba(107,76,42,0.07)',
                  borderRadius: '6px',
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
