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
}

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Latest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'net-desc', label: 'Net Qty: High to Low' },
  { value: 'net-asc', label: 'Net Qty: Low to High' },
];

const TYPE_FILTER_OPTIONS: Array<{ value: BranchTransactionRow['type']; label: string }> = [
  { value: 'Stock-In', label: 'Stock-In' },
  { value: 'Stock-Out', label: 'Stock-Out' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Adjustment', label: 'Adjustment' },
];

export function BranchTransactionsTab({ transactions }: BranchTransactionsTabProps) {
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
        transaction.postedBy.toLowerCase().includes(normalizedQuery);

      const matchesType = !typeFilter || transaction.type === typeFilter;

      return matchesQuery && matchesType;
    });

    nextTransactions.sort((left, right) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
        case 'net-desc':
          return right.netChange - left.netChange;
        case 'net-asc':
          return left.netChange - right.netChange;
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
        width: '22%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
            {transaction.reference}
          </Typography>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '18%',
        render: (transaction) => (
          <Chip
            label={transaction.type}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor:
                transaction.type === 'Stock-In'
                  ? 'success.light'
                  : transaction.type === 'Stock-Out'
                    ? 'error.light'
                    : transaction.type === 'Transfer'
                      ? 'info.light'
                      : 'warning.light',
              color:
                transaction.type === 'Stock-In'
                  ? 'success.dark'
                  : transaction.type === 'Stock-Out'
                    ? 'error.dark'
                    : transaction.type === 'Transfer'
                      ? 'info.dark'
                      : 'warning.dark',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        key: 'lineItems',
        label: 'Line Items',
        width: '14%',
        align: 'right',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 600 }}>
            {transaction.lineItems}
          </Typography>
        ),
      },
      {
        key: 'netChange',
        label: 'Net Qty',
        width: '14%',
        align: 'right',
        render: (transaction) => (
          <Typography
            sx={{
              fontSize: 12.5,
              color: transaction.netChange >= 0 ? 'success.main' : 'error.main',
              fontWeight: 700,
            }}
          >
            {transaction.netChange >= 0 ? '+' : ''}
            {transaction.netChange}
          </Typography>
        ),
      },
      {
        key: 'postedBy',
        label: 'Posted By',
        width: '18%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{transaction.postedBy}</Typography>
        ),
      },
      {
        key: 'timestamp',
        label: 'Date',
        width: '14%',
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
          placeholder="Search by reference, type, or posted by"
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
          minWidth={160}
        />
      </Box>

      <DataTable
        data={filteredTransactions}
        columns={columns}
        keyExtractor={(transaction) => transaction.id}
        defaultPageSize={5}
        pageSizes={[5, 10, 25]}
        emptyMessage="No transactions match your filters."
      />
    </Box>
  );
}
