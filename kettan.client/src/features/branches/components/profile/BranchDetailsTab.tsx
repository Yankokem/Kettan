import { Box, Chip, Divider, Grid, Typography } from '@mui/material';
import type { BranchFormData } from '../../types';
import { formatSchedule } from '../../branchProfileData';

interface OptionItem {
  value: string;
  label: string;
}

interface BranchDetailsTabProps {
  formData: BranchFormData;
  statusOptions: OptionItem[];
  ownerOptions: OptionItem[];
  managerOptions: OptionItem[];
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.45 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, color: 'text.primary', fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

export function BranchDetailsTab({
  formData,
  statusOptions,
  ownerOptions,
  managerOptions,
}: BranchDetailsTabProps) {
  const statusLabel = statusOptions.find((option) => option.value === formData.status)?.label ?? formData.status;
  const ownerLabel = ownerOptions.find((option) => option.value === formData.ownerUserId)?.label || 'Unassigned';
  const managerLabel = managerOptions.find((option) => option.value === formData.managerUserId)?.label || 'Not assigned';
  const notesValue = formData.notes?.trim() ? formData.notes : 'No notes added for this branch.';

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
        <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Location and Contact</Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailItem label="Branch Name" value={formData.name} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.45 }}>
            Status
          </Typography>
          <Chip
            label={statusLabel}
            size="small"
            sx={{
              height: 24,
              borderRadius: 999,
              bgcolor: formData.status === 'active' ? 'success.light' : 'grey.200',
              color: formData.status === 'active' ? 'success.dark' : 'text.secondary',
              fontWeight: 700,
              fontSize: 11,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <DetailItem label="Address" value={formData.address} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailItem label="City" value={formData.city} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailItem label="Contact Number" value={formData.contactNumber} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
        <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Operations and Assignment</Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailItem label="Open Time" value={formatSchedule(formData.openTime)} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailItem label="Close Time" value={formatSchedule(formData.closeTime)} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailItem label="Assigned Owner" value={ownerLabel} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailItem label="Branch Manager" value={managerLabel} />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <DetailItem label="Branch Notes" value={notesValue} />
        </Grid>
      </Grid>
    </Box>
  );
}
