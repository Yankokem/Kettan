import { useMemo, useState } from 'react';
import { Avatar, Box, Chip, Typography } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { Button } from '../../../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import { SearchInput } from '../../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../../components/UI/FilterAndSort';
import type { BranchEmployee } from '../../types';
import { formatDate } from '../../branchProfileData';

interface BranchStaffTabProps {
  employees: BranchEmployee[];
  onAddStaff: () => void;
  onOpenStaffProfile: (employee: BranchEmployee) => void;
}

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'hired-newest', label: 'Newest Hires' },
  { value: 'hired-oldest', label: 'Oldest Hires' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function BranchStaffTab({ employees, onAddStaff, onOpenStaffProfile }: BranchStaffTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [statusFilter, setStatusFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  const positionOptions = useMemo(
    () =>
      Array.from(new Set(employees.map((employee) => employee.position)))
        .sort((left, right) => left.localeCompare(right))
        .map((position) => ({ value: position, label: position })),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const nextEmployees = employees.filter((employee) => {
      const matchesQuery =
        !normalizedQuery ||
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(normalizedQuery) ||
        employee.position.toLowerCase().includes(normalizedQuery) ||
        employee.contactNumber.toLowerCase().includes(normalizedQuery) ||
        String(employee.id).includes(normalizedQuery);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' ? employee.isActive : !employee.isActive);

      const matchesPosition = !positionFilter || employee.position === positionFilter;

      return matchesQuery && matchesStatus && matchesPosition;
    });

    nextEmployees.sort((left, right) => {
      switch (sortBy) {
        case 'name-desc':
          return `${right.firstName} ${right.lastName}`.localeCompare(`${left.firstName} ${left.lastName}`);
        case 'hired-newest':
          return new Date(right.dateHired).getTime() - new Date(left.dateHired).getTime();
        case 'hired-oldest':
          return new Date(left.dateHired).getTime() - new Date(right.dateHired).getTime();
        case 'name-asc':
        default:
          return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`);
      }
    });

    return nextEmployees;
  }, [employees, positionFilter, searchQuery, sortBy, statusFilter]);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.2, mb: 2.8, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', flex: 1 }}>
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search staff by name, role, contact, or ID"
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
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            label="Status"
            icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
            minWidth={145}
          />

          <FilterDropdown
            value={positionFilter}
            onChange={setPositionFilter}
            options={positionOptions}
            label="Position"
            icon={<BadgeRoundedIcon sx={{ fontSize: 16 }} />}
            minWidth={170}
          />
        </Box>

        <Button startIcon={<PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />} onClick={onAddStaff} sx={{ ml: 'auto' }}>
          Add Staff
        </Button>
      </Box>

      <DataTable
        data={filteredEmployees}
        columns={staffColumns}
        keyExtractor={(employee) => String(employee.id)}
        defaultPageSize={5}
        pageSizes={[5, 10, 25]}
        emptyMessage="No staff members match your filters."
        onRowClick={onOpenStaffProfile}
      />
    </Box>
  );
}
