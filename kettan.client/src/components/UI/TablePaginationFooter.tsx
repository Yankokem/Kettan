import React from 'react';
import { Box, Typography, Select, MenuItem, Pagination } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

export interface TablePaginationFooterProps {
  totalItems: number;
  page: number; // 0-indexed
  rowsPerPage: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  onRowsPerPageChange: (event: SelectChangeEvent<number>) => void;
  rowsPerPageOptions?: number[];
}

export function TablePaginationFooter({
  totalItems,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [15, 25, 50]
}: TablePaginationFooterProps) {
  const startItem = totalItems === 0 ? 0 : page * rowsPerPage + 1;
  const endItem = Math.min((page + 1) * rowsPerPage, totalItems);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1, px: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
            Rows per page:
          </Typography>
          <Select
            value={rowsPerPage}
            onChange={onRowsPerPageChange}
            size="small"
            sx={{
              fontSize: 13,
              height: 32,
              '& .MuiSelect-select': { py: 0.5, pl: 1.5, pr: 3, fontWeight: 600 },
              '& fieldset': { borderColor: 'divider', borderRadius: 2 }
            }}
          >
            {rowsPerPageOptions.map(option => (
              <MenuItem key={option} value={option} sx={{ fontSize: 13 }}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Showing <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{startItem}</Typography> - <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{endItem}</Typography> of <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{totalItems}</Typography>
        </Typography>
      </Box>
      <Pagination
        count={Math.ceil(totalItems / rowsPerPage)}
        page={page + 1}
        onChange={onPageChange}
        shape="rounded"
        color="primary"
        sx={{
          '& .MuiPaginationItem-root': {
            fontSize: 13,
            fontWeight: 600,
            height: 32,
            minWidth: 32,
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.contrastText',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          }
        }}
      />
    </Box>
  );
}