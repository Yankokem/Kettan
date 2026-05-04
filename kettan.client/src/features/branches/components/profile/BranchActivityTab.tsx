import { useMemo, useState } from 'react';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import { SearchInput } from '../../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../../components/UI/FilterAndSort';
import type { BranchActivityLog } from '../../types';
import { formatDateTime } from '../../branchProfileData';

interface BranchActivityTabProps {
  logs: BranchActivityLog[];
}

const SORT_OPTIONS = [
  { value: 'time-desc', label: 'Latest First' },
  { value: 'time-asc', label: 'Oldest First' },
  { value: 'outcome', label: 'Outcome Priority' },
];

const OUTCOME_FILTER_OPTIONS: Array<{ value: BranchActivityLog['outcome']; label: string }> = [
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'flagged', label: 'Flagged' },
];

export function BranchActivityTab({ logs }: BranchActivityTabProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(logs.map((log) => log.category)))
        .sort((left, right) => left.localeCompare(right))
        .map((category) => ({ value: category, label: category })),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const nextLogs = logs.filter((log) => {
      const matchesQuery =
        !normalizedQuery ||
        log.event.toLowerCase().includes(normalizedQuery) ||
        log.actor.toLowerCase().includes(normalizedQuery) ||
        log.category.toLowerCase().includes(normalizedQuery);

      const matchesOutcome = !outcomeFilter || log.outcome === outcomeFilter;
      const matchesCategory = !categoryFilter || log.category === categoryFilter;

      return matchesQuery && matchesOutcome && matchesCategory;
    });

    const outcomeWeight: Record<BranchActivityLog['outcome'], number> = {
      flagged: 0,
      pending: 1,
      successful: 2,
    };

    nextLogs.sort((left, right) => {
      switch (sortBy) {
        case 'time-asc':
          return new Date(left.happenedAt).getTime() - new Date(right.happenedAt).getTime();
        case 'outcome':
          return outcomeWeight[left.outcome] - outcomeWeight[right.outcome];
        case 'time-desc':
        default:
          return new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime();
      }
    });

    return nextLogs;
  }, [categoryFilter, logs, outcomeFilter, searchQuery, sortBy]);

  const columns = useMemo<ColumnDef<BranchActivityLog>[]>(
    () => [
      {
        key: 'happenedAt',
        label: 'Timestamp',
        width: '1.5fr',
        render: (log) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
            {formatDateTime(log.happenedAt)}
          </Typography>
        ),
      },
      {
        key: 'action',
        label: 'Action',
        width: '1fr',
        render: (log) => {
          const action = log.action || 'Updated';
          const isCreated = action === 'Created';
          const isDeleted = action === 'Deleted' || action.toLowerCase().includes('archive');
          const color = isCreated ? '#047857' : isDeleted ? '#B91C1C' : '#2563EB';
          return (
            <Typography 
              sx={{ 
                fontSize: 13, 
                fontWeight: 800, 
                color,
                letterSpacing: '0.01em'
              }}
            >
              {action}
            </Typography>
          );
        },
      },
      {
        key: 'event',
        label: 'Event',
        width: '3.5fr',
        render: (log) => (
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: 'text.primary', letterSpacing: '0.01em' }}>
              <Box component="span" sx={{ fontWeight: 800, color: '#6B4C2A' }}>{log.action}</Box>
              {` the `}
              <Box component="span" sx={{ fontWeight: 700 }}>{log.event}</Box>
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'capitalize', mt: 0.3, fontWeight: 500, opacity: 0.8 }}>
              Category: {log.category}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'actor',
        label: 'User',
        width: '2fr',
        render: (log) => (
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>
            {log.actor}
          </Typography>
        ),
      },
      {
        key: 'role',
        label: 'Role',
        width: '1.2fr',
        render: (log) => {
          const roleStyle = theme.custom.roles[log.role] || { text: theme.palette.text.secondary };
          return (
            <Typography sx={{ fontSize: 13, color: roleStyle.text, fontWeight: 600 }}>
              {log.role || 'Staff'}
            </Typography>
          );
        },
      },
      {
        key: 'outcome',
        label: 'Outcome',
        width: '1fr',
        align: 'center',
        render: (log) => {
          const color = log.outcome === 'successful' 
            ? theme.custom.status.success 
            : log.outcome === 'pending' 
              ? theme.custom.status.pending 
              : theme.custom.status.danger;
          return (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color,
                textTransform: 'capitalize',
              }}
            >
              {log.outcome}
            </Typography>
          );
        },
      },
    ],
    [theme]
  );

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.8 }}>
        <SearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search events, actor, or category"
          sx={{ minWidth: 240, maxWidth: 380, flex: 1 }}
        />

        <FilterDropdown
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
          label="Sort"
          icon={<SortRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={175}
        />

        <FilterDropdown
          value={outcomeFilter}
          onChange={setOutcomeFilter}
          options={OUTCOME_FILTER_OPTIONS}
          label="Outcome"
          icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={160}
        />

        <FilterDropdown
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          label="Category"
          icon={<CategoryRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={165}
        />
      </Box>

      <DataTable
        data={filteredLogs}
        columns={columns}
        keyExtractor={(log) => log.id}
        defaultPageSize={5}
        pageSizes={[5, 10, 25]}
        emptyMessage="No activity logs match your filters."
      />
    </Box>
  );
}
