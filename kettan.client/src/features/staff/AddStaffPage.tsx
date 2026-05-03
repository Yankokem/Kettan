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
  { value: 'StoreStaff', label: 'Store Staff' },
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
    if (!formData.firstName.trim()) {
      alert('Please enter first name.');
      return;
    }

    if (!formData.lastName.trim()) {
      alert('Please enter last name.');
      return;
    }

    if (!formData.email.trim()) {
      alert('Please enter email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!formData.password) {
      alert('Please enter a password.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    // Password strength check
    let score = 0;
    const pwd = formData.password;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score < 4) {
      alert('Password must be at least 8 characters and include uppercase, number, and special character.');
      return;
    }

    if (!formData.role) {
      alert('Please select a role.');
      return;
    }

    if (formData.contactNo && !/^\+?[0-9\s\-()]+$/.test(formData.contactNo)) {
      alert('Please enter a valid contact number.');
      return;
    }

    if (formData.contactNo && formData.contactNo.replace(/\D/g, '').length < 7) {
      alert('Contact number must contain at least 7 digits.');
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
      // Check if backend returned a nicely formatted 400 error message (like "Email already in use")
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert('An error occurred while creating the staff member. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBranchRole = formData.role === 'BranchManager' || formData.role === 'BranchOwner' || formData.role === 'StoreStaff';
  const showPendingWarning = isBranchRole && !formData.branchId;

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
                  onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, contactNo: event.target.value }))}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  fullWidth
                  autoComplete="new-password"
                />
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75, ml: 0.5 }}>
                  Must be at least 8 characters with uppercase, number, and special character.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <FormTextField
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
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
                  }}
                  fullWidth
                />
              </Box>
            </Grid>

            {/* Only show Branch selection for Branch-specific roles */}
            {formData.role && (formData.role === 'BranchOwner' || formData.role === 'BranchManager' || formData.role === 'StoreStaff') && (
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
