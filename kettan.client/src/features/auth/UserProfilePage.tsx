import { Box, Typography, Paper, Grid, Divider } from '@mui/material';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNavigate } from '@tanstack/react-router';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';
import { ProfileImageUploader } from '../../components/UI/ProfileImageUploader';
import { useAuthStore } from '../../store/useAuthStore';

interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  birthday: string;
  contactNo: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState<UserProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    birthday: '',
    contactNo: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/api/users/${user.id}`);
        const userData = response.data;

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          birthday: userData.birthday ? userData.birthday.split('T')[0] : '',
          contactNo: userData.contactNo || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        if (user.imageUrl) {
          setImagePreviewUrl(user.imageUrl);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        alert('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadUserProfile();
  }, [user?.id, user?.imageUrl]);

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
      alert('Please enter your first name.');
      return;
    }

    if (!formData.lastName.trim()) {
      alert('Please enter your last name.');
      return;
    }

    if (!formData.email.trim()) {
      alert('Please enter your email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    // Password validation (only if changing password)
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        alert('Please enter your current password to change your password.');
        return;
      }

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

    if (formData.contactNo && !/^\+?[0-9\s\-()]+$/.test(formData.contactNo)) {
      alert('Please enter a valid contact number.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload image first if one was selected
      let imageUrl: string | null = user?.imageUrl || null;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        const uploadRes = await api.post('/api/uploads/image', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          const uploadData = uploadRes.data;
          imageUrl = uploadData.Url ?? uploadData.url ?? null;
          console.log('[Upload] Profile image URL:', imageUrl);
        } else {
          console.error('[Upload] Profile image upload failed:', uploadRes.status);
        }
      }

      // Update user profile
      await api.put(`/api/users/${user?.id}`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthday: formData.birthday || null,
        contactNo: formData.contactNo.trim() || null,
        role: user?.role,
        branchId: user?.branchId,
        isActive: true,
      });

      // Update auth profile (name and image)
      await api.put('/api/auth/profile', {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        imageUrl,
      });

      // Update local auth store
      updateUser({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        imageUrl: imageUrl || undefined,
      });

      // TODO: Handle password change if needed
      // This would require a separate endpoint on the backend

      alert('Profile updated successfully!');
      void navigate({ to: '/' });
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('An error occurred while updating your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ pb: 3 }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            My Profile
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Manage your personal information and account settings.
          </Typography>
        </Box>
      </Box>

      {/* Form Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left Panel - Profile Picture & Basic Info */}
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

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
              Account Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  User ID
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{user?.id}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  Role
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{user?.role}</Typography>
              </Box>
              {user?.branchId && (
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                    Branch ID
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{user.branchId}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Right Panel - Personal Details & Password */}
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
            Personal Details
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            Update your personal information and contact details.
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
              disabled
            />
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75, ml: 0.5 }}>
              Email cannot be changed. Contact your administrator if you need to update it.
            </Typography>
          </Box>

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

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Change Password
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            Leave blank if you don't want to change your password.
          </Typography>

          <Box sx={{ mb: 2.5 }}>
            <FormTextField
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              value={formData.currentPassword}
              onChange={(event) => setFormData((prev) => ({ ...prev, currentPassword: event.target.value }))}
              fullWidth
            />
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="New Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.newPassword}
                onChange={(event) => setFormData((prev) => ({ ...prev, newPassword: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box sx={{ pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormActions
              cancelTo="/"
              saveText={isSubmitting ? 'Updating...' : 'Update Profile'}
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
