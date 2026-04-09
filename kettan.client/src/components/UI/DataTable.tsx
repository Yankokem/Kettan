import React, { useState } from 'react';
import { Box, Typography, TablePagination } from '@mui/material';

export interface ColumnDef<T> {
  key: string;
  label: string;
  gridWidth?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  title?: React.ReactNode;
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  defaultPageSize?: number;
  pageSizes?: number[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  title,
  data,
  columns,
  keyExtractor,
  defaultPageSize = 5,
  pageSizes = [5, 10, 25],
  emptyMessage = 'No records found.',
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const gridTemplateColumns = columns
    .map((column) => column.gridWidth || column.width || '1fr')
    .join(' ');
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const showPagination = data.length > 0;

  const getAlign = (align?: ColumnDef<T>['align']) => {
    if (!align || align === 'left') {
      return 'flex-start';
    }

    if (align === 'center') {
      return 'center';
    }

    return 'flex-end';
  };

  return (
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
            sx={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              textAlign: col.align || 'left',
            }}
          >
            {col.label}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      {paginatedData.length > 0 ? (
        paginatedData.map((row) => (
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
          count={data.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={pageSizes}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      ) : null}
    </Box>
  );
}
