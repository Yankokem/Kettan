import { useMemo, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import { SearchInput } from '../../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../../components/UI/FilterAndSort';
import type { BranchTransactionRow } from '../../types';
import { formatDate } from '../../branchProfileData';

interface BranchTransactionsTabProps {
  transactions: BranchTransactionRow[];
  loading?: boolean;
}

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Latest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'value-desc', label: 'Value: High to Low' },
  { value: 'value-asc', label: 'Value: Low to High' },
];

const TYPE_FILTER_OPTIONS: Array<{ value: BranchTransactionRow['type']; label: string }> = [
  { value: 'Supply Request', label: 'Supply Requests' },
  { value: 'Supply Push', label: 'Supply Pushes' },
  { value: 'Return', label: 'Returns' },
];

const TYPE_CHIP_STYLES: Record<BranchTransactionRow['type'], { bg: string; color: string }> = {
  'Supply Request': { bg: 'rgba(201,168,76,0.14)', color: '#6B4C2A' },
  'Supply Push': { bg: 'rgba(22,101,52,0.1)', color: '#166534' },
  'Return': { bg: 'rgba(185,28,28,0.08)', color: '#991B1B' },
};

export function BranchTransactionsTab({ transactions, loading = false }: BranchTransactionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [typeFilter, setTypeFilter] = useState('');

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const nextTransactions = transactions.filter((transaction) => {
      const matchesQuery =
        !normalizedQuery ||
        transaction.reference.toLowerCase().includes(normalizedQuery) ||
        transaction.type.toLowerCase().includes(normalizedQuery) ||
        transaction.status.toLowerCase().includes(normalizedQuery) ||
        transaction.postedBy.toLowerCase().includes(normalizedQuery);

      const matchesType = !typeFilter || transaction.type === typeFilter;

      return matchesQuery && matchesType;
    });

    nextTransactions.sort((left, right) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
        case 'value-desc':
          return right.totalValue - left.totalValue;
        case 'value-asc':
          return left.totalValue - right.totalValue;
        case 'date-desc':
        default:
          return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
      }
    });

    return nextTransactions;
  }, [searchQuery, sortBy, transactions, typeFilter]);

  const columns = useMemo<ColumnDef<BranchTransactionRow>[]>(
    () => [
      {
        key: 'reference',
        label: 'Reference',
        width: '2fr',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
            {transaction.reference}
          </Typography>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '1.6fr',
        render: (transaction) => {
          const style = TYPE_CHIP_STYLES[transaction.type];
          return (
            <Chip
              label={transaction.type}
              size="small"
              sx={{
                height: 24,
                borderRadius: 1.5,
                bgcolor: style.bg,
                color: style.color,
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '1.6fr',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
            {transaction.status}
          </Typography>
        ),
      },
      {
        key: 'lineItems',
        label: 'Items',
        width: '1fr',
        align: 'right',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 600 }}>
            {transaction.lineItems}
          </Typography>
        ),
      },
      {
        key: 'totalValue',
        label: 'Value',
        width: '1.4fr',
        align: 'right',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary' }}>
            ₱{Number(transaction.totalValue).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        ),
      },
      {
        key: 'postedBy',
        label: 'Source',
        width: '1.4fr',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{transaction.postedBy}</Typography>
        ),
      },
      {
        key: 'timestamp',
        label: 'Date',
        width: '1fr',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatDate(transaction.timestamp)}</Typography>
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.8 }}>
        <SearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by reference, type, status, or source"
          sx={{ minWidth: 240, maxWidth: 380, flex: 1 }}
        />

        <FilterDropdown
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
          label="Sort"
          icon={<SortRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={185}
        />

        <FilterDropdown
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_FILTER_OPTIONS}
          label="Type"
          icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={175}
        />
      </Box>

      <DataTable
        data={filteredTransactions}
        columns={columns}
        keyExtractor={(transaction) => transaction.id}
        defaultPageSize={10}
        pageSizes={[10, 25, 50]}
        isLoading={loading}
        emptyMessage="No transactions match your filters."
      />
    </Box>
  );
}
