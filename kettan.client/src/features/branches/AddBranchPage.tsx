import { Box, Typography, Paper, Divider, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from '@tanstack/react-router';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { PageHeader } from '../../components/UI/PageHeader';
import { FormActions } from '../../components/Form/FormActions';
import { ProfileImageUploader } from '../../components/UI/ProfileImageUploader';
import { TimePicker } from '../../components/UI/TimePicker';
import { createBranch } from './branchesApi';
import type { BranchFormData, BranchStatus } from './types';

interface UserDto {
  userId: number;
  firstName: string;
  lastName: string;
  role: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Operational)' },
  { value: 'setup', label: 'Setup Pending' },
];

const CONTACT_NUMBER_PATTERN = /^[+]?[-()\d\s]{7,20}$/;

const parseTimeToMinutes = (value: string) => {
  const [hourText, minuteText] = value.split(':');
  const hours = Number(hourText);
  const minutes = Number(minuteText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.NaN;
  }

  return (hours * 60) + minutes;
};

export function AddBranchPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    address: '',
    city: '',
    contactNumber: '',
    openTime: '07:00',
    closeTime: '22:00',
    ownerUserId: '',
    managerUserId: '',
    status: 'setup',
    notes: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [users, setUsers] = useState<UserDto[]>([]);

  useEffect(() => {
    api.get('/api/users').then(res => res.data)
      .then(data => setUsers(data))
      .catch(err => console.error('Failed to fetch users:', err));
  }, []);

  const ownerOptions = [
    { value: '', label: 'Select an owner...' },
    ...users
      .filter((u) => u.role === 'BranchOwner')
      .map((u) => ({ value: String(u.userId), label: `${u.firstName} ${u.lastName}` })),
  ];

  const managerOptions = [
    { value: '', label: 'Select a manager...' },
    ...users
      .filter((u) => u.role === 'BranchManager')
      .map((u) => ({ value: String(u.userId), label: `${u.firstName} ${u.lastName}` })),
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a branch name.');
      return;
    }

    if (!formData.address.trim()) {
      alert('Please enter a branch address.');
      return;
    }

    if (!formData.city.trim()) {
      alert('Please enter a city.');
      return;
    }

    if (!formData.contactNumber.trim()) {
      alert('Please enter a contact number.');
      return;
    }

    if (!CONTACT_NUMBER_PATTERN.test(formData.contactNumber.trim())) {
      alert('Please enter a valid contact number.');
      return;
    }

    if (!formData.openTime || !formData.closeTime) {
      alert('Please set opening and closing times.');
      return;
    }

    const openMinutes = parseTimeToMinutes(formData.openTime);
    const closeMinutes = parseTimeToMinutes(formData.closeTime);

    if (Number.isNaN(openMinutes) || Number.isNaN(closeMinutes) || openMinutes >= closeMinutes) {
      alert('Open time must be earlier than close time.');
      return;
    }

    if (!formData.ownerUserId) {
      alert('Please assign an owner.');
      return;
    }

    if (!formData.managerUserId) {
      alert('Please assign a manager.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload image first if one was selected
      let imageUrl: string | null = null;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        const uploadRes = await api.post('/api/uploads/image', uploadFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          const uploadData = uploadRes.data;
          // Backend returns { Url, PublicId } (PascalCase)
          imageUrl = uploadData.Url ?? uploadData.url ?? null;
          console.log('[Upload] Branch image URL:', imageUrl);
        } else {
          const errData = uploadRes.data;
          console.error('[Upload] Branch image upload failed:', uploadRes.status, errData);
        }
      }

      // Create branch via API
      await createBranch({
        name: formData.name.trim(),
        location: [formData.address.trim(), formData.city.trim()].filter(Boolean).join(', '),
        address: formData.address.trim(),
        city: formData.city.trim(),
        contactNumber: formData.contactNumber.trim(),
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        ownerUserId: formData.ownerUserId,
        managerUserId: formData.managerUserId,
        imageUrl,
      });

      alert('Branch registered successfully!');
      void navigate({ to: '/branches' });
    } catch (err) {
      console.error('Failed to create branch:', err);
      alert('An error occurred while registering the branch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header section */}
      <PageHeader
        title="Register New Branch"
        description="Establish a new storefront or operations center in the system."
        backTo="/branches"
      />

      {/* Form Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left Panel */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '38%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: { xs: 3, md: 4 },
          }}
        >
          {/* Branch Picture Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <ImageRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Branch Picture</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
              Branch Image (Optional)
            </Typography>
            <Box sx={{ maxWidth: 250 }}>
              <ProfileImageUploader
                imageFile={imageFile ?? undefined}
                label="Upload Branch Picture"
                subLabel="PNG or JPG up to 5MB"
                onFileChange={(file) => setImageFile(file)}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Basic Information Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <BusinessRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Basic Information</Typography>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <FormTextField
              label="Branch Name"
              placeholder="e.g. BGC Reserve"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
          </Box>

          <Box>
            <FormDropdown
              label="Status"
              value={formData.status}
              options={STATUS_OPTIONS}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, status: event.target.value as BranchStatus }))
              }
              fullWidth
            />
          </Box>
        </Paper>

        {/* Right Panel */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: { xs: 3, md: 4 },
          }}
        >
          {/* Branch Details Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <LocationOnRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Branch Details</Typography>
          </Box>

          <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            Set branch profile details, operating hours, and leadership assignments.
          </Typography>

          <Box sx={{ mb: 2.5 }}>
            <FormTextField
              label="Address"
              placeholder="e.g. 5th Avenue, Bonifacio Global City"
              value={formData.address}
              onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="City"
                placeholder="e.g. Taguig City"
                value={formData.city}
                onChange={(event) => setFormData((prev) => ({ ...prev, city: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Contact Number"
                placeholder="e.g. +63 917 123 4567"
                value={formData.contactNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactNumber: event.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Operating Hours Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Operating Hours</Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Open Time
                </Typography>
              </Box>
              <TimePicker
                value={formData.openTime}
                onChange={(event) => setFormData((prev) => ({ ...prev, openTime: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Close Time
                </Typography>
              </Box>
              <TimePicker
                value={formData.closeTime}
                onChange={(event) => setFormData((prev) => ({ ...prev, closeTime: event.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Leadership Assignments Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <BadgeRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Leadership Assignments</Typography>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <FormDropdown
              label="Assigned Owner"
              value={formData.ownerUserId}
              options={ownerOptions}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, ownerUserId: String(event.target.value) }))
              }
              fullWidth
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormDropdown
              label="Assigned Manager"
              value={formData.managerUserId}
              options={managerOptions}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, managerUserId: String(event.target.value) }))
              }
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Operations Notes Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <NotesRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Operations Notes</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormTextField
              label="Operations Notes"
              placeholder="Share setup reminders, handoff notes, or launch details for this branch..."
              value={formData.notes || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
              multiline
              rows={4}
              fullWidth
            />
          </Box>

          <Box sx={{ pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormActions
              cancelTo="/branches"
              saveText={isSubmitting ? 'Registering...' : 'Register Branch'}
              saveIcon={<BusinessRoundedIcon />}
              onSave={() => { void handleSubmit(); }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
