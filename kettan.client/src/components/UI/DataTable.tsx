import React, { useState } from 'react';
import { Box, Typography, TablePagination } from '@mui/material';

export interface ColumnDef<T> {
  key: string;
  label: string;
  gridWidth: string;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  title: React.ReactNode;
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({ title, data, columns, keyExtractor }: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const gridTemplateColumns = columns.map(c => c.gridWidth).join(' ');
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box
      className="glass-card"
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
            }}
          >
            {col.label}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      {paginatedData.map((row) => (
        <Box
          key={keyExtractor(row)}
          className="hover-lift"
          sx={{
            display: 'grid',
            gridTemplateColumns,
            px: 3,
            py: 1.75,
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            cursor: 'default',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {columns.map((col) => (
            <Box key={col.key}>
              {col.render(row)}
            </Box>
          ))}
        </Box>
      ))}

      {/* Pagination component from MUI */}
      <TablePagination
        component="div"
        count={data.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
      />
    </Box>
  );
}
