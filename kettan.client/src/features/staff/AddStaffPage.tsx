import { Box, Typography, Paper, Grid, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from '@tanstack/react-router';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
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
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/staff" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Add Staff Member
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Create a new staff account with role and access permissions.
          </Typography>
        </Box>
      </Box>

      {/* Form Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left Panel - Profile Picture */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '38%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 4,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
            Profile Picture
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

          <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', mt: 3 }}>
            Upload an optional profile picture for this staff member. This will be displayed in the staff directory and throughout the system.
          </Typography>
        </Paper>

        {/* Right Panel - Staff Details */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 4,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Staff Details
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            Enter the staff member's personal information and account credentials.
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="First Name"
                placeholder="e.g. Juan"
                value={formData.firstName}
                onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Last Name"
                placeholder="e.g. Dela Cruz"
                value={formData.lastName}
                onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 2.5 }}>
            <FormTextField
              label="Email Address"
              placeholder="juan@kettan.co"
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              fullWidth
            />
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                fullWidth
              />
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75, ml: 0.5 }}>
                Must be at least 8 characters with uppercase, number, and special character.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Confirm Password"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Birthday (Optional)"
                type="date"
                value={formData.birthday}
                onChange={(event) => setFormData((prev) => ({ ...prev, birthday: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Contact Number (Optional)"
                placeholder="e.g. +63 917 123 4567"
                value={formData.contactNo}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactNo: event.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 2.5 }}>
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
                  // Auto-clear branch if switching to HQ role to prevent data bugs
                  branchId: isHq ? '' : prev.branchId,
                }));
              }}
              fullWidth
            />
          </Box>

          {/* Only show Branch selection for Branch-specific roles */}
          {formData.role && (formData.role === 'BranchOwner' || formData.role === 'BranchManager' || formData.role === 'StoreStaff') && (
            <Box sx={{ mb: 3 }}>
              <FormDropdown
                label="Branch (Optional)"
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
          )}
          
          {showPendingWarning && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
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
