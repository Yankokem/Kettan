import { useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import type { BranchActivityLog } from '../../types';
import { formatDateTime } from '../../branchProfileData';

interface BranchActivityTabProps {
  logs: BranchActivityLog[];
}

export function BranchActivityTab({ logs }: BranchActivityTabProps) {
  const columns = useMemo<ColumnDef<BranchActivityLog>[]>(
    () => [
      {
        key: 'event',
        label: 'Event',
        width: '45%',
        render: (log) => (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{log.event}</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', textTransform: 'capitalize' }}>
              {log.category}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'actor',
        label: 'Actor',
        width: '20%',
        render: (log) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{log.actor}</Typography>,
      },
      {
        key: 'happenedAt',
        label: 'Timestamp',
        width: '22%',
        render: (log) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatDateTime(log.happenedAt)}</Typography>
        ),
      },
      {
        key: 'outcome',
        label: 'Outcome',
        width: '13%',
        align: 'center',
        render: (log) => (
          <Chip
            label={log.outcome}
            size="small"
            sx={{
              height: 24,
              textTransform: 'capitalize',
              borderRadius: 1.5,
              bgcolor:
                log.outcome === 'successful'
                  ? 'success.light'
                  : log.outcome === 'pending'
                    ? 'warning.light'
                    : 'error.light',
              color:
                log.outcome === 'successful'
                  ? 'success.dark'
                  : log.outcome === 'pending'
                    ? 'warning.dark'
                    : 'error.dark',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      <DataTable
        data={logs}
        columns={columns}
        keyExtractor={(log) => log.id}
        defaultPageSize={5}
        pageSizes={[5, 10, 25]}
        emptyMessage="No activity logs available for this branch."
      />
    </Box>
  );
}
