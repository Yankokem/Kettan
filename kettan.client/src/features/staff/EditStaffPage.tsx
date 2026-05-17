import { Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useAuthStore } from '../../store/useAuthStore';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
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
  birthday: string;
  contactNo: string;
  role: '' | 'TenantAdmin' | 'HqManager' | 'HqStaff' | 'BranchOwner' | 'BranchManager' | 'StoreStaff';
  branchId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ROLE_OPTIONS: Array<{ value: StaffFormData['role']; label: string }> = [
  { value: '', label: 'Select a role...' },
  { value: 'TenantAdmin', label: 'Tenant Admin' },
  { value: 'HqManager', label: 'HQ Manager' },
  { value: 'HqStaff', label: 'HQ Staff' },
  { value: 'BranchOwner', label: 'Branch Owner' },
  { value: 'BranchManager', label: 'Branch Manager' },
];

export function EditStaffPage() {
  const navigate = useNavigate();
  const { staffId } = useParams({ from: '/layout/staff/$staffId/edit' });
  const { user: currentUser } = useAuthStore();
  
  const canEditCredentials = currentUser?.role === 'TenantAdmin';

  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    email: '',
    birthday: '',
    contactNo: '',
    role: '',
    branchId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBranches().then(setBranches).catch(console.error);
    
    const loadStaffData = async () => {
      const id = Number(staffId);
      if (Number.isNaN(id)) {
        alert('Invalid staff ID.');
        void navigate({ to: '/staff' });
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/api/users/${id}`);
        const userData = response.data;

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          birthday: userData.birthday ? userData.birthday.split('T')[0] : '',
          contactNo: userData.contactNo || '',
          role: userData.role || '',
          branchId: userData.branchId ? String(userData.branchId) : '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        if (userData.imageUrl) {
          setImagePreviewUrl(userData.imageUrl);
        }
      } catch (err) {
        console.error('Failed to load staff data:', err);
        alert('Failed to load staff data. Please try again.');
        void navigate({ to: '/staff' });
      } finally {
        setIsLoading(false);
      }
    };

    void loadStaffData();
  }, [staffId, navigate]);

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

    // Password validation (only if changing password)
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('New password and confirmation do not match.');
        return;
      }

      if (formData.newPassword.length < 8) {
        alert('New password must be at least 8 characters long.');
        return;
      }

      // Password strength check
      let score = 0;
      const pwd = formData.newPassword;
      if (pwd.length >= 8) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

      if (score < 4) {
        alert('Password must include uppercase, number, and special character.');
        return;
      }
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
      let imageUrl: string | null = imagePreviewUrl;
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

      // Update staff member
      await api.put(`/api/users/${staffId}`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        birthday: formData.birthday || null,
        contactNo: formData.contactNo.trim() || null,
        role: formData.role,
        branchId: formData.branchId ? parseInt(formData.branchId) : null,
        isActive: true,
        imageUrl: imageUrl !== null ? imageUrl : undefined,
        password: formData.newPassword || undefined,
      });

      alert('Staff member updated successfully!');
      void navigate({ to: `/staff/${staffId}` });
    } catch (err: any) {
      console.error('Failed to update staff member:', err);
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert('An error occurred while updating the staff member. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBranch = isBranchRole(formData.role);
  const showPendingWarning = isBranch && !formData.branchId;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress sx={{ color: '#C9A84C' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header section */}
      <PageHeader
        title="Edit Staff Member"
        description="Update staff member information and access permissions."
        backTo={`/staff/${staffId}`}
      />

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
            borderRadius: '14px',
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
              Profile Image
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
            Update the profile picture for this staff member. This will be displayed in the staff directory and throughout the system.
          </Typography>
        </Paper>

        {/* Right Panel - Staff Details */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: 4,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Staff Details
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            Update the staff member's personal information and account settings.
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
              disabled={!canEditCredentials}
            />
            {!canEditCredentials && (
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75, ml: 0.5 }}>
                Email cannot be changed. Contact your administrator if you need to update it.
              </Typography>
            )}
          </Box>

          {canEditCredentials && (
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormTextField
                  label="New Password"
                  placeholder="Leave blank to keep current"
                  type="password"
                  value={formData.newPassword}
                  onChange={(event) => setFormData((prev) => ({ ...prev, newPassword: event.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormTextField
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
          )}

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Birthday"
                type="date"
                value={formData.birthday}
                onChange={(event) => setFormData((prev) => ({ ...prev, birthday: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Contact Number"
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
              onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value as StaffFormData['role'] }))}
              fullWidth
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormDropdown
              label="Branch"
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

          {showPendingWarning && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              {isBranch && !formData.branchId && "The account's status is Pending and cannot log in until assigned to a branch."}
            </Alert>
          )}

          <Box sx={{ pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormActions
              cancelTo={`/staff/${staffId}`}
              saveText={isSubmitting ? 'Updating...' : 'Update Staff Member'}
              saveIcon={<PersonRoundedIcon />}
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
