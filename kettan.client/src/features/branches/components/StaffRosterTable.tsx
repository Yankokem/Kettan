import { Chip, Typography } from '@mui/material';
import { KettanTable, type KettanColumnDef } from '../../../components/UI/KettanTable';
import type { BranchEmployee } from '../types';

interface StaffRosterTableProps {
  employees: BranchEmployee[];
}

const formatDate = (dateValue: string) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const columns: KettanColumnDef<BranchEmployee>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: 'text.primary' }}>
        {row.firstName} {row.lastName}
      </Typography>
    ),
  },
  {
    key: 'position',
    label: 'Position',
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary' }}>
        {row.position}
      </Typography>
    ),
  },
  {
    key: 'contactNumber',
    label: 'Contact',
    render: (row) => (
      <Typography sx={{ fontWeight: 500, fontSize: 13, color: 'text.secondary' }}>
        {row.contactNumber}
      </Typography>
    ),
  },
  {
    key: 'dateHired',
    label: 'Date Hired',
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontWeight: 500, fontSize: 13, color: 'text.secondary' }}>
        {formatDate(row.dateHired)}
      </Typography>
    ),
  },
  {
    key: 'isActive',
    label: 'Status',
    render: (row) => (
      <Chip
        label={row.isActive ? 'Active' : 'Inactive'}
        size="small"
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 1,
          bgcolor: row.isActive ? 'success.light' : '#F3F4F6',
          color: row.isActive ? 'success.dark' : '#4B5563',
        }}
      />
    ),
  },
];

export function StaffRosterTable({ employees }: StaffRosterTableProps) {
  return (
    <KettanTable
      columns={columns}
      data={employees}
      keyExtractor={(row) => row.id.toString()}
      emptyMessage="No employees assigned to this branch yet."
      defaultRowsPerPage={5}
      rowsPerPageOptions={[5, 10, 25]}
      striped
    />
  );
}
