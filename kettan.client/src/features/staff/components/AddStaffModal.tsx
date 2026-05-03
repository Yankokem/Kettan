import { useEffect, useState } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { Button } from '../../../components/UI/Button';
import { FormTextField } from '../../../components/Form/FormTextField';
import { FormDropdown } from '../../../components/Form/FormDropdown';
import { ProfileImageUploader } from '../../../components/UI/ProfileImageUploader';

export interface AddStaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  birthday?: string;
  contactNo?: string;
  role: '' | 'TenantAdmin' | 'HqManager' | 'HqStaff' | 'BranchOwner' | 'BranchManager' | 'StoreStaff';
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (formValues: AddStaffFormValues) => void;
}

type FormErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'contactNo' | 'role', string>>;

const ROLE_OPTIONS: Array<{ value: AddStaffFormValues['role']; label: string }> = [
  { value: '', label: 'Select a role...' },
  { value: 'TenantAdmin', label: 'Tenant Admin' },
  { value: 'HqManager', label: 'HQ Manager' },
  { value: 'HqStaff', label: 'HQ Staff' },
  { value: 'BranchOwner', label: 'Branch Owner' },
  { value: 'BranchManager', label: 'Branch Manager' },
  { value: 'StoreStaff', label: 'Store Staff' },
];

function buildInitialFormValues(): AddStaffFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthday: '',
    contactNo: '',
    role: '',
    imageFile: null,
    imagePreviewUrl: null,
  };
}

export function AddStaffModal({
  open,
  onClose,
  onSave,
}: AddStaffModalProps) {
  const [formValues, setFormValues] = useState<AddStaffFormValues>(() => buildInitialFormValues());

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(buildInitialFormValues());
    setErrors({});
  }, [open]);

  const updateField = <K extends keyof AddStaffFormValues>(field: K, value: AddStaffFormValues[K]) => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const clearImage = () => {
    updateField('imageFile', null);
    updateField('imagePreviewUrl', null);
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      clearImage();
      return;
    }
    updateField('imageFile', file);
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

    if (!formValues.password) {
      nextErrors.password = 'Password is required.';
    } else {
      let score = 0;
      const pwd = formValues.password;
      if (pwd.length >= 8) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
      if (score < 4) {
        nextErrors.password = 'Password must be at least 8 characters and include uppercase, number, and special character.';
      }
    }

    if (formValues.contactNo) {
      if (!/^\+?[0-9\s\-()]+$/.test(formValues.contactNo)) {
        nextErrors.contactNo = 'Invalid phone number format.';
      } else if (formValues.contactNo.replace(/\D/g, '').length < 7) {
        nextErrors.contactNo = 'Phone number must contain at least 7 digits.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    clearImage();
    setErrors({});
    setFormValues(buildInitialFormValues());
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
          borderRadius: '14px',
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

            <ProfileImageUploader
              imageFile={formValues.imageFile ?? undefined}
              imageUrl={formValues.imagePreviewUrl}
              onFileChange={handleFileSelection}
            />
          </Box>

          <Box sx={{ width: { xs: '100%', md: '70%' }, pl: { md: 3 }, pt: { xs: 3, md: 0 } }}>

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

              <Grid size={{ xs: 12 }}>
                <FormTextField
                  label="Password"
                  placeholder="Minimum 8 characters"
                  type="password"
                  value={formValues.password || ''}
                  onChange={(event) => updateField('password', event.target.value)}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormTextField
                  label="Birthday"
                  type="date"
                  value={formValues.birthday || ''}
                  onChange={(event) => updateField('birthday', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormTextField
                  label="Contact No"
                  placeholder="e.g. +63 912 345 6789"
                  value={formValues.contactNo || ''}
                  onChange={(event) => updateField('contactNo', event.target.value)}
                  error={Boolean(errors.contactNo)}
                  helperText={errors.contactNo}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
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
