import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { Save } from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { Dropdown } from '../../../../components/UI/Dropdown';
import { TextField } from '../../../../components/UI/TextField';
import { TimePicker } from '../../../../components/UI/TimePicker';
import type { BranchFormData, BranchStatus } from '../../types';

interface OptionItem {
  value: string;
  label: string;
}

type UpdateBranchField = <K extends keyof BranchFormData>(field: K, value: BranchFormData[K]) => void;

interface BranchEditModalProps {
  open: boolean;
  formData: BranchFormData | null;
  statusOptions: OptionItem[];
  cityOptions: OptionItem[];
  ownerOptions: OptionItem[];
  managerOptions: OptionItem[];
  onClose: () => void;
  onSave: () => void;
  onUpdate: UpdateBranchField;
}

export function BranchEditModal({
  open,
  formData,
  statusOptions,
  cityOptions,
  ownerOptions,
  managerOptions,
  onClose,
  onSave,
  onUpdate,
}: BranchEditModalProps) {
  if (!formData) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Edit Branch Details</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
          <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Location and Contact</Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Branch Name</Typography>
            <TextField value={formData.name} onChange={(event) => onUpdate('name', event.target.value)} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Status</Typography>
            <Dropdown
              value={formData.status}
              fullWidth
              options={statusOptions}
              onChange={(event) => onUpdate('status', event.target.value as BranchStatus)}
              sx={{ width: '100%', minWidth: 'auto' }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Address</Typography>
            <TextField
              multiline
              rows={2}
              value={formData.address}
              onChange={(event) => onUpdate('address', event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>City</Typography>
            <Dropdown
              value={formData.city}
              fullWidth
              options={cityOptions}
              onChange={(event) => onUpdate('city', String(event.target.value))}
              sx={{ width: '100%', minWidth: 'auto' }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Contact Number</Typography>
            <TextField value={formData.contactNumber} onChange={(event) => onUpdate('contactNumber', event.target.value)} />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3.2, mb: 2.5, color: '#6B4C2A' }}>
          <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Operations and Assignment</Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Open Time</Typography>
            <TimePicker
              value={formData.openTime}
              onChange={(event) => onUpdate('openTime', event.target.value)}
              size="small"
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Close Time</Typography>
            <TimePicker
              value={formData.closeTime}
              onChange={(event) => onUpdate('closeTime', event.target.value)}
              size="small"
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Assigned Owner</Typography>
            <Dropdown
              value={formData.ownerUserId}
              fullWidth
              options={ownerOptions}
              onChange={(event) => onUpdate('ownerUserId', String(event.target.value))}
              sx={{ width: '100%', minWidth: 'auto' }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Branch Manager</Typography>
            <Dropdown
              value={formData.managerUserId}
              fullWidth
              options={managerOptions}
              onChange={(event) => onUpdate('managerUserId', String(event.target.value))}
              sx={{ width: '100%', minWidth: 'auto' }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Branch Notes</Typography>
            <TextField
              multiline
              rows={3}
              value={formData.notes ?? ''}
              onChange={(event) => onUpdate('notes', event.target.value)}
              placeholder="Optional notes for this branch"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button startIcon={<Save size={15} />} onClick={onSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
