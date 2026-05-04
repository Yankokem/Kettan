import { Avatar, Box, Chip, IconButton, Menu, MenuItem, ListItemIcon, Typography, useTheme } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import type { StaffMember } from '../types';
import { KettanTable, type KettanColumnDef } from '../../../components/UI/KettanTable';
import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';

interface StaffTableViewProps {
  data: StaffMember[];
  onOpenProfile: (staffId: number) => void;
  onEdit: (staffId: number) => void;
  onActivate: (staffId: number) => void;
  onInactivate: (staffId: number) => void;
  onArchive: (staffId: number) => void;
}

const getStatusChip = (status: StaffMember['status'], theme: any) => {
  const style = theme.custom.status[status];

  return (
    <Chip
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      size="small"
      sx={{
        height: 22,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: style.bg,
        color: style.text,
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'rgba(0,0,0,0.03)',
      }}
    />
  );
};

function StaffActionsMenu({
  staff,
  onEdit,
  onActivate,
  onInactivate,
  onArchive,
}: {
  staff: StaffMember;
  onEdit: (staffId: number) => void;
  onActivate: (staffId: number) => void;
  onInactivate: (staffId: number) => void;
  onArchive: (staffId: number) => void;
}) {
  const { user: currentUser } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isSelf = String(staff.id) === currentUser?.id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit(staff.id);
  };

  const handleActivate = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onActivate(staff.id);
  };

  const handleInactivate = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onInactivate(staff.id);
  };

  const handleArchive = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onArchive(staff.id);
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleMenuOpen}
        sx={{ color: 'text.secondary', '&:hover': { color: '#6B4C2A', bgcolor: '#FAF5EF' } }}
      >
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(event) => event.stopPropagation()}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 160,
            mt: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: 14,
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { bgcolor: 'rgba(201,168,77,0.08)', color: '#6B4C2A' },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
          </ListItemIcon>
          Edit
        </MenuItem>
        {staff.status !== 'active' ? (
          <MenuItem onClick={handleActivate}>
            <ListItemIcon>
              <CheckCircleRoundedIcon fontSize="small" sx={{ color: '#2E7D32' }} />
            </ListItemIcon>
            <Typography sx={{ color: '#2E7D32', fontSize: 14, fontWeight: 500 }}>
              {staff.status === 'archived' ? 'Restore' : 'Activate'}
            </Typography>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleInactivate} disabled={isSelf}>
            <ListItemIcon>
              <BlockRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
            </ListItemIcon>
            Inactivate
          </MenuItem>
        )}

        {staff.status !== 'archived' && (
          <MenuItem onClick={handleArchive} disabled={isSelf}>
            <ListItemIcon>
              <ArchiveRoundedIcon fontSize="small" sx={{ color: isSelf ? 'inherit' : '#B91C1C' }} />
            </ListItemIcon>
            <Typography sx={{ color: isSelf ? 'inherit' : '#B91C1C', fontSize: 14, fontWeight: 500 }}>Archive</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export function StaffTableView({ data, onOpenProfile, onEdit, onActivate, onInactivate, onArchive }: StaffTableViewProps) {
  const theme = useTheme();
  const columns: KettanColumnDef<StaffMember>[] = [
    {
      key: 'name',
      label: 'Staff',
      sortable: true,
      gridWidth: '2fr',
      sortAccessor: (row) => row.name,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar
            src={row.imageUrl || undefined}
            sx={{
              width: 36,
              height: 36,
              bgcolor: theme.palette.mode === 'light' ? '#FAF5EF' : 'rgba(201,168,77,0.05)',
              color: '#6B4C2A',
              fontWeight: 700,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            {!row.imageUrl ? row.avatar : null}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: theme.palette.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      gridWidth: '1.3fr',
      sortAccessor: (row) => row.role,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary, fontWeight: 600 }}>
          {row.role}
        </Typography>
      ),
    },
    {
      key: 'location',
      label: 'Branch',
      sortable: true,
      gridWidth: '1.3fr',
      sortAccessor: (row) => row.location,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary, fontWeight: 600 }}>
          {row.location}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      gridWidth: '0.8fr',
      align: 'center',
      sortAccessor: (row) => row.status,
      render: (row) => getStatusChip(row.status, theme),
    },
    {
      key: 'actions',
      label: 'Actions',
      gridWidth: '90px',
      align: 'right',
      render: (row) => (
        <StaffActionsMenu
          staff={row}
          onEdit={onEdit}
          onActivate={onActivate}
          onInactivate={onInactivate}
          onArchive={onArchive}
        />
      ),
    },
  ];

  return (
    <KettanTable
      columns={columns}
      data={data}
      keyExtractor={(row) => row.id.toString()}
      onRowClick={(row) => onOpenProfile(row.id)}
      emptyMessage="No staff found for the current filters."
      defaultRowsPerPage={8}
      rowsPerPageOptions={[8, 16, 24]}
      striped
    />
  );
}
