import React from 'react';
import { Box, Typography } from '@mui/material';

export interface MatrixColumnDef<T> {
  key: string;
  label: string;
  gridWidth?: string | number;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => React.ReactNode;
}

interface MatrixTableProps<T> {
  data: T[];
  columns: MatrixColumnDef<T>[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  striped?: boolean;
}

function getAlign(align?: MatrixColumnDef<unknown>['align']) {
  if (!align || align === 'left') {
    return 'flex-start';
  }

  if (align === 'center') {
    return 'center';
  }

  return 'flex-end';
}

export function MatrixTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
  striped = false,
}: MatrixTableProps<T>) {
  const gridTemplateColumns = columns
    .map((column) => {
      const widthToken = column.gridWidth ?? column.width;

      if (typeof widthToken === 'number') {
        return `${widthToken}px`;
      }

      return widthToken || '1fr';
    })
    .join(' ');

  return (
    <Box
      className="glass-card"
      sx={{
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns,
          px: 3,
          py: 1.3,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {columns.map((column) => (
          <Typography
            key={column.key}
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              textAlign: column.align || 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: getAlign(column.align),
            }}
          >
            {column.label}
          </Typography>
        ))}
      </Box>

      {data.length > 0 ? (
        data.map((row, rowIndex) => (
          <Box
            key={keyExtractor(row)}
            sx={{
              display: 'grid',
              gridTemplateColumns,
              px: 3,
              py: 1.75,
              alignItems: 'center',
              bgcolor: striped && rowIndex % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent',
              borderBottom: rowIndex === data.length - 1 ? 'none' : '1px solid',
              borderColor: 'divider',
            }}
          >
            {columns.map((column) => (
              <Box key={column.key} sx={{ display: 'flex', justifyContent: getAlign(column.align) }}>
                {column.render(row)}
              </Box>
            ))}
          </Box>
        ))
      ) : (
        <Box
          sx={{
            px: 3,
            py: 8,
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
    </Box>
  );
}
