import { Box, Typography, Paper, Grid, Alert, Divider } from '@mui/material';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from '@tanstack/react-router';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { PageHeader } from '../../components/UI/PageHeader';
import { FormActions } from '../../components/Form/FormActions';
import { ProfileImageUploader } from '../../components/UI/ProfileImageUploader';
import { fetchBranches, type BranchDto } from '../branches/branchesApi';
import { isBranchRole } from '../../utils/roleHelpers';

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthday: string;
  contactNo: string;
  role: '' | 'TenantAdmin' | 'HqManager' | 'HqStaff' | 'BranchOwner' | 'BranchManager' | 'StoreStaff';
  branchId: string;
}

const ROLE_OPTIONS: Array<{ value: StaffFormData['role']; label: string }> = [
  { value: '', label: 'Select a role...' },
  { value: 'HqManager', label: 'HQ Manager' },
  { value: 'HqStaff', label: 'HQ Staff' },
  { value: 'BranchOwner', label: 'Branch Owner' },
  { value: 'BranchManager', label: 'Branch Manager' },
];

export function AddStaffPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    contactNo: '',
    role: '',
    branchId: '',
  });
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({});

  useEffect(() => {
    fetchBranches().then(setBranches).catch(console.error);
  }, []);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validation
    const newErrors: Partial<Record<keyof StaffFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Please enter first name.';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Please enter last name.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter a password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    } else {
      // Password strength check
      let score = 0;
      const pwd = formData.password;
      if (pwd.length >= 8) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

      if (score < 4) {
        newErrors.password = 'Password must be at least 8 characters and include uppercase, number, and special character.';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role.';
    }

    if (formData.contactNo) {
      if (!/^\+?[0-9\s\-()]+$/.test(formData.contactNo)) {
        newErrors.contactNo = 'Please enter a valid contact number.';
      } else if (formData.contactNo.replace(/\D/g, '').length < 7) {
        newErrors.contactNo = 'Contact number must contain at least 7 digits.';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload image first if one was selected
      let imageUrl: string | null = null;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        const uploadRes = await api.post('/api/uploads/image', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          const uploadData = uploadRes.data;
          imageUrl = uploadData.Url ?? uploadData.url ?? null;
          console.log('[Upload] Staff image URL:', imageUrl);
        } else {
          console.error('[Upload] Staff image upload failed:', uploadRes.status);
        }
      }

      // Create staff member
      await api.post('/api/users', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        birthday: formData.birthday || null,
        contactNo: formData.contactNo.trim() || null,
        role: formData.role,
        branchId: formData.branchId ? parseInt(formData.branchId) : null,
        imageUrl,
      });

      alert('Staff member created successfully!');
      void navigate({ to: '/staff' });
    } catch (err: any) {
      console.error('Failed to create staff member:', err);
      if (err.response?.status === 400 && err.response?.data?.errors) {
        // Map backend validation errors to inline fields
        const backendErrors = err.response.data.errors;
        const mappedErrors: Partial<Record<keyof StaffFormData, string>> = {};
        for (const key in backendErrors) {
          const lowerKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof StaffFormData;
          mappedErrors[lowerKey] = backendErrors[key][0];
        }
        setErrors(mappedErrors);
      } else if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert('An error occurred while creating the staff member. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBranch = isBranchRole(formData.role);
  const showPendingWarning = isBranch && !formData.branchId;

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header section */}
      <PageHeader
        title="Add Staff Member"
        description="Create a new staff account with role and access permissions."
        backTo="/staff"
      />

      {/* Form Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left Panel - Personal Information */}
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
          {/* Profile Picture Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <ImageRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Profile Picture</Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                  Profile Image (Optional)
                </Typography>
                <Box sx={{ maxWidth: 250 }}>
                  <ProfileImageUploader
                    imageFile={imageFile ?? undefined}
                    imageUrl={imagePreviewUrl}
                    label="Upload Profile Picture"
                    subLabel="PNG or JPG up to 5MB"
                    onFileChange={handleImageChange}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
            Upload an optional profile picture for this staff member. This will be displayed in the staff directory and throughout the system.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Personal Information Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <PersonRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Personal Information</Typography>
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <Box>
                <FormTextField
                  label="First Name"
                  placeholder="e.g. Juan"
                  value={formData.firstName}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, firstName: event.target.value }));
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  fullWidth
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box>
                <FormTextField
                  label="Last Name"
                  placeholder="e.g. Dela Cruz"
                  value={formData.lastName}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, lastName: event.target.value }));
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  fullWidth
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box>
                <FormTextField
                  label="Birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(event) => setFormData((prev) => ({ ...prev, birthday: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box>
                <FormTextField
                  label="Contact Number"
                  placeholder="e.g. +63 917 123 4567"
                  value={formData.contactNo}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, contactNo: event.target.value }));
                    if (errors.contactNo) setErrors((prev) => ({ ...prev, contactNo: undefined }));
                  }}
                  error={!!errors.contactNo}
                  helperText={errors.contactNo}
                  fullWidth
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Right Panel - Account Details */}
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
          {/* Account Credentials Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <LockRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Account Credentials</Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <Box>
                <FormTextField
                  label="Email Address"
                  placeholder="juan@kettan.co"
                  type="email"
                  value={formData.email}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, email: event.target.value }));
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                  autoComplete="off"
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <FormTextField
                  label="Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, password: event.target.value }));
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  error={!!errors.password}
                  helperText={errors.password || "Must be at least 8 chars (upper, num, special)"}
                  fullWidth
                  autoComplete="new-password"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <FormTextField
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }));
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  fullWidth
                  autoComplete="new-password"
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Role and Assignment Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <BadgeRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Role and Assignment</Typography>
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <Box>
                <FormDropdown
                  label="Role"
                  value={formData.role}
                  options={ROLE_OPTIONS}
                  onChange={(event) => {
                    const newRole = event.target.value as StaffFormData['role'];
                    const isHq = newRole === 'HqManager' || newRole === 'HqStaff';
                    setFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      branchId: isHq ? '' : prev.branchId,
                    }));
                    if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                  }}
                  error={!!errors.role}
                  helperText={errors.role}
                  fullWidth
                />
              </Box>
            </Grid>

            {/* Only show Branch selection for Branch-specific roles */}
            {formData.role && isBranchRole(formData.role) && (
              <Grid size={{ xs: 12 }}>
                <Box>
                  <FormDropdown
                    label="Branch Assignment"
                    value={formData.branchId}
                    options={[
                      { value: '', label: 'Select a branch...' },
                      ...branches.map((b) => ({ value: String(b.branchId), label: b.name })),
                    ]}
                    onChange={(event) => setFormData((prev) => ({ ...prev, branchId: event.target.value as string }))}
                    fullWidth
                  />
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75, ml: 0.5 }}>
                    Assign this staff member to a specific branch. Leave blank for HQ staff.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
          
          {showPendingWarning && (
            <Alert severity="warning" sx={{ mt: 2.5, borderRadius: 2 }}>
              The account's status will be Pending and cannot log in until assigned to a branch.
            </Alert>
          )}

          <Box sx={{ pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormActions
              cancelTo="/staff"
              saveText={isSubmitting ? 'Creating...' : 'Create Staff Member'}
              saveIcon={<PersonAddAlt1RoundedIcon />}
              onSave={() => {
                void handleSubmit();
              }}
              saveDisabled={isSubmitting}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
