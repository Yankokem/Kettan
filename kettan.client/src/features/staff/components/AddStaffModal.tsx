import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Button } from '../../../components/UI/Button';
import { FormTextField } from '../../../components/Form/FormTextField';
import { FormDropdown } from '../../../components/Form/FormDropdown';

export interface AddStaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: '' | 'hq' | 'manager' | 'staff';
  branchAssignment: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

interface BranchOption {
  value: string;
  label: string;
}

interface AddStaffModalProps {
  open: boolean;
  branchOptions: BranchOption[];
  initialBranchId?: string;
  initialBranchName?: string;
  onClose: () => void;
  onSave: (formValues: AddStaffFormValues) => void;
}

type FormErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'role' | 'branchAssignment', string>>;

const ROLE_OPTIONS: Array<{ value: AddStaffFormValues['role']; label: string }> = [
  { value: '', label: 'Select a role...' },
  { value: 'hq', label: 'HQ Executive' },
  { value: 'manager', label: 'Branch Manager' },
  { value: 'staff', label: 'Store Staff' },
];

function buildInitialFormValues(initialBranchId?: string): AddStaffFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    branchAssignment: initialBranchId ?? '',
    imageFile: null,
    imagePreviewUrl: null,
  };
}

export function AddStaffModal({
  open,
  branchOptions,
  initialBranchId,
  initialBranchName,
  onClose,
  onSave,
}: AddStaffModalProps) {
  const [formValues, setFormValues] = useState<AddStaffFormValues>(() => buildInitialFormValues(initialBranchId));
  const [errors, setErrors] = useState<FormErrors>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const resolvedBranchName =
    initialBranchName ?? branchOptions.find((option) => option.value === (initialBranchId ?? ''))?.label;

  const branchAssignmentOptions = useMemo(
    () => [{ value: '', label: 'Select a branch...' }, ...branchOptions],
    [branchOptions]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(buildInitialFormValues(initialBranchId));
    setErrors({});
  }, [open, initialBranchId]);

  useEffect(
    () => () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    },
    []
  );

  const updateField = <K extends keyof AddStaffFormValues>(field: K, value: AddStaffFormValues[K]) => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const clearImage = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    updateField('imageFile', null);
    updateField('imagePreviewUrl', null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelection = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = nextPreviewUrl;

    updateField('imageFile', file);
    updateField('imagePreviewUrl', nextPreviewUrl);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files?.[0]);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!formValues.firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    }

    if (!formValues.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
    }

    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formValues.role) {
      nextErrors.role = 'Role is required.';
    }

    if (!formValues.branchAssignment) {
      nextErrors.branchAssignment = 'Branch assignment is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    clearImage();
    setErrors({});
    setFormValues(buildInitialFormValues(initialBranchId));
    onClose();
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    onSave({
      ...formValues,
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim(),
    });

    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Add Staff Member</DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2.5, md: 3 }, py: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box
            sx={{
              width: { xs: '100%', md: '30%' },
              pr: { md: 3 },
              pb: { xs: 3, md: 0 },
              borderRight: { xs: 'none', md: '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#6B4C2A', mb: 0.6 }}>Profile Image</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 1.8 }}>
              Upload an optional image for this staff profile.
            </Typography>

            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: '100%',
                maxWidth: { xs: '100%', md: 240 },
                mx: 'auto',
                aspectRatio: '1 / 1',
                border: '2px dashed',
                borderColor: formValues.imagePreviewUrl ? 'rgba(107,76,42,0.22)' : 'divider',
                borderRadius: 3,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: formValues.imagePreviewUrl ? '#FAF5EF' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#C9A84C',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {formValues.imagePreviewUrl ? (
                <Box component="img" src={formValues.imagePreviewUrl} alt="Selected staff profile" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Avatar
                    sx={{
                      width: 62,
                      height: 62,
                      mx: 'auto',
                      mb: 1.4,
                      bgcolor: 'rgba(107,76,42,0.14)',
                      color: '#6B4C2A',
                    }}
                  >
                    <CameraAltRoundedIcon sx={{ fontSize: 26 }} />
                  </Avatar>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>Upload Photo</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.35 }}>PNG or JPG up to 5MB</Typography>
                </Box>
              )}
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              onChange={handleFileChange}
            />

            <Box sx={{ mt: 1.6, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<CloudUploadRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={() => fileInputRef.current?.click()}
              >
                {formValues.imagePreviewUrl ? 'Replace' : 'Upload'}
              </Button>

              {formValues.imagePreviewUrl ? (
                <Button
                  variant="outlined"
                  startIcon={<CloseRoundedIcon sx={{ fontSize: 18 }} />}
                  onClick={clearImage}
                  sx={{
                    color: '#B91C1C',
                    borderColor: 'rgba(185,28,28,0.35)',
                    '&:hover': {
                      borderColor: '#B91C1C',
                      bgcolor: 'rgba(185,28,28,0.06)',
                    },
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </Box>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '70%' }, pl: { md: 3 }, pt: { xs: 3, md: 0 } }}>
            {resolvedBranchName ? (
              <Chip
                size="small"
                label={`Branch preselected: ${resolvedBranchName}`}
                sx={{
                  mb: 2,
                  height: 24,
                  borderRadius: 999,
                  bgcolor: 'rgba(107,76,42,0.12)',
                  color: '#6B4C2A',
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            ) : null}

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormTextField
                  label="First Name"
                  placeholder="e.g. Juan"
                  value={formValues.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormTextField
                  label="Last Name"
                  placeholder="e.g. Dela Cruz"
                  value={formValues.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormTextField
                  label="Email Address"
                  placeholder="juan@kettan.co"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormDropdown
                  label="Role"
                  value={formValues.role}
                  options={ROLE_OPTIONS}
                  onChange={(event) => updateField('role', String(event.target.value) as AddStaffFormValues['role'])}
                  error={Boolean(errors.role)}
                />
                {errors.role ? (
                  <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.75, ml: 1 }}>{errors.role}</Typography>
                ) : null}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormDropdown
                  label="Branch Assignment"
                  value={formValues.branchAssignment}
                  options={branchAssignmentOptions}
                  onChange={(event) => updateField('branchAssignment', String(event.target.value))}
                  error={Boolean(errors.branchAssignment)}
                />
                {errors.branchAssignment ? (
                  <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.75, ml: 1 }}>{errors.branchAssignment}</Typography>
                ) : null}
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <Button startIcon={<PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />} onClick={handleSave}>
          Create Profile
        </Button>
      </DialogActions>
    </Dialog>
  );
}
