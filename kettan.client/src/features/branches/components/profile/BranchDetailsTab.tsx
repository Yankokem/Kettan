import { Box, Divider, Grid, Typography } from '@mui/material';
import { PencilLine, Save } from 'lucide-react';
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

interface BranchDetailsTabProps {
  formData: BranchFormData;
  isEditing: boolean;
  statusOptions: OptionItem[];
  cityOptions: OptionItem[];
  ownerOptions: OptionItem[];
  managerOptions: OptionItem[];
  onEnableEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onUpdate: UpdateBranchField;
}

export function BranchDetailsTab({
  formData,
  isEditing,
  statusOptions,
  cityOptions,
  ownerOptions,
  managerOptions,
  onEnableEdit,
  onSave,
  onDiscard,
  onUpdate,
}: BranchDetailsTabProps) {
  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      {!isEditing ? (
        <Box sx={{ mb: 2.6, display: 'flex', justifyContent: 'flex-end' }}>
          <Button startIcon={<PencilLine size={15} />} onClick={onEnableEdit}>
            Edit Branch
          </Button>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
        <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Location and Contact</Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Branch Name</Typography>
          <TextField disabled={!isEditing} value={formData.name} onChange={(event) => onUpdate('name', event.target.value)} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Status</Typography>
          <Dropdown
            disabled={!isEditing}
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
            disabled={!isEditing}
            multiline
            rows={2}
            value={formData.address}
            onChange={(event) => onUpdate('address', event.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>City</Typography>
          <Dropdown
            disabled={!isEditing}
            value={formData.city}
            fullWidth
            options={cityOptions}
            onChange={(event) => onUpdate('city', String(event.target.value))}
            sx={{ width: '100%', minWidth: 'auto' }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Contact Number</Typography>
          <TextField
            disabled={!isEditing}
            value={formData.contactNumber}
            onChange={(event) => onUpdate('contactNumber', event.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
        <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Operations and Assignment</Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Open Time</Typography>
          <TimePicker
            disabled={!isEditing}
            value={formData.openTime}
            onChange={(event) => onUpdate('openTime', event.target.value)}
            size="small"
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Close Time</Typography>
          <TimePicker
            disabled={!isEditing}
            value={formData.closeTime}
            onChange={(event) => onUpdate('closeTime', event.target.value)}
            size="small"
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Assigned Owner</Typography>
          <Dropdown
            disabled={!isEditing}
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
            disabled={!isEditing}
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
            disabled={!isEditing}
            multiline
            rows={3}
            value={formData.notes ?? ''}
            onChange={(event) => onUpdate('notes', event.target.value)}
            placeholder="Optional notes for this branch"
          />
        </Grid>
      </Grid>

      {isEditing ? (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={onDiscard}>
            Discard
          </Button>
          <Button startIcon={<Save size={15} />} onClick={onSave}>
            Save Changes
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
