import { useMemo } from 'react';
import { Avatar, Box, Chip, Typography } from '@mui/material';
import { UserPlus } from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import type { BranchEmployee } from '../../types';
import { formatDate } from '../../branchProfileData';

interface BranchStaffTabProps {
  employees: BranchEmployee[];
  onAddStaff: () => void;
  onOpenStaffProfile: (employee: BranchEmployee) => void;
}

export function BranchStaffTab({ employees, onAddStaff, onOpenStaffProfile }: BranchStaffTabProps) {
  const activeStaffCount = employees.filter((employee) => employee.isActive).length;
  const inactiveStaffCount = employees.length - activeStaffCount;

  const staffColumns = useMemo<ColumnDef<BranchEmployee>[]>(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        width: '28%',
        render: (employee) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 12,
                bgcolor: employee.isActive ? 'rgba(107,76,42,0.15)' : 'rgba(148,163,184,0.18)',
                color: employee.isActive ? '#6B4C2A' : 'text.secondary',
                fontWeight: 700,
              }}
            >
              {`${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                {employee.firstName} {employee.lastName}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>ID {employee.id}</Typography>
            </Box>
          </Box>
        ),
      },
      {
        key: 'position',
        label: 'Position',
        width: '20%',
        render: (employee) => (
          <Chip
            label={employee.position}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor: employee.position.toLowerCase().includes('lead') ? 'rgba(201,168,76,0.22)' : 'rgba(107,76,42,0.09)',
              color: employee.position.toLowerCase().includes('lead') ? '#5C4518' : '#6B4C2A',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        key: 'contact',
        label: 'Contact',
        width: '19%',
        render: (employee) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
            {employee.contactNumber}
          </Typography>
        ),
      },
      {
        key: 'dateHired',
        label: 'Date Hired',
        width: '18%',
        render: (employee) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
            {formatDate(employee.dateHired)}
          </Typography>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '15%',
        align: 'center',
        render: (employee) => (
          <Chip
            label={employee.isActive ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor: employee.isActive ? 'success.light' : 'grey.200',
              color: employee.isActive ? 'success.dark' : 'text.secondary',
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2.8, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600, mt: 1 }}>
          Click any row to open the employee profile.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
            {activeStaffCount} active / {inactiveStaffCount} inactive
          </Typography>
          <Button startIcon={<UserPlus size={15} />} onClick={onAddStaff}>
            Add Staff
          </Button>
        </Box>
      </Box>

      <DataTable
        data={employees}
        columns={staffColumns}
        keyExtractor={(employee) => String(employee.id)}
        defaultPageSize={5}
        pageSizes={[5, 10, 25]}
        emptyMessage="No employees assigned to this branch yet."
        onRowClick={onOpenStaffProfile}
      />
    </Box>
  );
}
