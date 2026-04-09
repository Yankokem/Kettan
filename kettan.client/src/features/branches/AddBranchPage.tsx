import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';
import { ImageUpload } from '../../components/UI/ImageUpload';
import type { BranchFormData, BranchStatus } from './types';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Operational)' },
  { value: 'setup', label: 'Setup Pending' },
];

const MANAGER_OPTIONS = [
  { value: '', label: 'Select a manager...' },
  { value: '1', label: 'Miguel Santos' },
  { value: '2', label: 'Sarah Jenkins' },
  { value: '3', label: 'Anna Cruz' },
];

export function AddBranchPage() {
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    location: '',
    managerId: '',
    status: 'setup',
    picture: undefined,
    notes: '',
  });

  const handleImageUpload = (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG or JPG image.');
      return;
    }

    if (file.size > maxSizeBytes) {
      alert('Branch image must be 5MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, picture: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Please enter a branch name.');
      return;
    }

    if (!formData.location.trim()) {
      alert('Please enter a location address.');
      return;
    }

    if (!formData.managerId) {
      alert('Please assign a manager.');
      return;
    }

    const managerLabel = MANAGER_OPTIONS.find((manager) => manager.value === formData.managerId)?.label;

    console.log('Submitting branch:', {
      ...formData,
      managerName: managerLabel,
    });

    alert('Branch registered successfully! (Mock)');
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/branches" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Register New Branch
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Establish a new storefront or operations center in the system.
          </Typography>
        </Box>
      </Box>

      {/* Form Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left Panel */}
          <Box
            sx={{
              width: { xs: '100%', md: '40%' },
              p: 4,
              borderRight: { xs: 'none', md: '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Basic Information
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontSize: 11,
                  letterSpacing: '0.5px',
                  display: 'block',
                  mb: 1.5,
                }}
              >
                <ImageRoundedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                Branch Picture
              </Typography>

              {formData.picture ? (
                <Box sx={{ position: 'relative', maxWidth: 250 }}>
                  <Box
                    component="img"
                    src={formData.picture}
                    alt="Branch preview"
                    sx={{
                      width: '100%',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFormData((prev) => ({ ...prev, picture: undefined }))}
                    sx={{ mt: 1, width: '100%' }}
                  >
                    Remove Image
                  </Button>
                </Box>
              ) : (
                <Box sx={{ maxWidth: 250 }}>
                  <ImageUpload
                    onUpload={handleImageUpload}
                    label="Upload Branch Picture"
                    helperText="PNG or JPG up to 5MB"
                  />
                </Box>
              )}
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
          </Box>

          {/* Right Panel */}
          <Box sx={{ width: { xs: '100%', md: '60%' }, p: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Branch Details
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
              Set location details and assign an operations lead for this branch.
            </Typography>

            <Box sx={{ mb: 2.5 }}>
              <FormTextField
                label="Location Address"
                placeholder="e.g. 5th Avenue, Bonifacio Global City, Taguig"
                value={formData.location}
                onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormDropdown
                label="Assign Manager"
                value={formData.managerId}
                options={MANAGER_OPTIONS}
                onChange={(event) => setFormData((prev) => ({ ...prev, managerId: String(event.target.value) }))}
                fullWidth
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <FormTextField
                label="Operations Notes (Optional)"
                placeholder="Share setup reminders, handoff notes, or launch details for this branch..."
                value={formData.notes || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                multiline
                rows={4}
                fullWidth
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <FormActions
            cancelTo="/branches"
            saveText="Register Branch"
            saveIcon={<BusinessRoundedIcon />}
            onSave={handleSubmit}
          />
        </Box>
      </Paper>
    </Box>
  );
}
