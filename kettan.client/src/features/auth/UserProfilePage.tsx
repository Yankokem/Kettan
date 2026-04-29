import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import CakeRoundedIcon from '@mui/icons-material/CakeRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../utils/api';
import { getRoleDisplayName, getRoleBadgeColor } from '../../utils/roleHelpers';

interface UserProfileData {
  userId: number;
  tenantId: number | null;
  branchId: number | null;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  contactNo: string | null;
  isActive: boolean;
  createdAt: string;
  imageUrl?: string | null;
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/users/${user.id}`);
        setProfileData(response.data);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError('Could not load profile data.');
      } finally {
        setLoading(false);
      }
    };

    void loadUserProfile();
  }, [user?.id]);

  const handleCopyUserId = () => {
    if (profileData?.userId) {
      navigator.clipboard.writeText(String(profileData.userId));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress sx={{ color: '#C9A84C' }} />
      </Box>
    );
  }

  if (error || !profileData) {
    return (
      <Box sx={{ pb: 5 }}>
        <BackButton to="/" />
        <Typography sx={{ mt: 3, color: 'text.secondary' }}>{error ?? 'Profile not found.'}</Typography>
      </Box>
    );
  }

  const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
  const initials = `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();

  return (
    <Box sx={{ pb: 5 }}>
      {/* Back navigation */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              My Profile
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              View your account information and settings.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditRoundedIcon />}
          onClick={() => navigate({ to: '/profile/edit' })}
        >
          Edit Profile
        </Button>
      </Box>

      {/* Profile Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left Panel - Profile Picture & Quick Info */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '38%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Profile Picture */}
          <Avatar
            src={user?.imageUrl ?? undefined}
            variant="rounded"
            sx={{
              width: 150,
              height: 150,
              bgcolor: 'linear-gradient(135deg, #6B4C2A 0%, #C9A84C 100%)',
              color: '#FAF5EF',
              fontSize: 52,
              fontWeight: 700,
              border: '4px solid',
              borderColor: 'divider',
              borderRadius: 4,
              mb: 3,
              boxShadow: '0 8px 24px rgba(107, 76, 42, 0.15)',
            }}
          >
            {!user?.imageUrl ? initials : null}
          </Avatar>

          {/* Name & Role */}
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.01em' }}>
            {fullName}
          </Typography>

          <Chip
            icon={<BadgeRoundedIcon fontSize="small" />}
            label={getRoleDisplayName(profileData.role)}
            color={getRoleBadgeColor(profileData.role)}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              height: 32,
              fontSize: 13,
              mb: 3,
            }}
          />

          <Divider sx={{ width: '100%', mb: 3 }} />

          {/* Account Summary */}
          <Box sx={{ width: '100%' }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: '#6B4C2A',
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Account Summary
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* User ID */}
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                  User ID
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {String(profileData.userId).padStart(6, '0')}
                  </Typography>
                  <Tooltip title={copySuccess ? 'Copied!' : 'Copy User ID'}>
                    <IconButton size="small" onClick={handleCopyUserId} sx={{ p: 0.5 }}>
                      <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Status */}
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                  Account Status
                </Typography>
                <Chip
                  label={profileData.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    bgcolor: profileData.isActive ? '#FEF3C7' : '#F3F4F6',
                    color: profileData.isActive ? '#92400E' : '#4B5563',
                    fontWeight: 700,
                    borderRadius: 2,
                    height: 24,
                  }}
                />
              </Box>

              {/* Member Since */}
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                  Member Since
                </Typography>
                <Typography sx={{ fontSize: 14 }}>
                  {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Right Panel - Detailed Information */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Personal Information Card */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              p: 3.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: '#6B4C2A',
                mb: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Personal Information
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Full Name */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <PersonRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    Full Name
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
                    {fullName}
                  </Typography>
                </Box>
              </Box>

              {/* Email */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <EmailRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    Email Address
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 15, color: 'text.primary' }}>{profileData.email}</Typography>
                    <VerifiedRoundedIcon sx={{ fontSize: 16, color: '#10B981' }} />
                  </Box>
                </Box>
              </Box>

              {/* Contact Number */}
              {profileData.contactNo && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <PhoneRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                      Contact Number
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                      {profileData.contactNo}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Birthday */}
              {profileData.birthday && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <CakeRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                      Birthday
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                      {new Date(profileData.birthday).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Account & Access Card */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              p: 3.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: '#6B4C2A',
                mb: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Account &amp; Access
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Role */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <BadgeRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    Role
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
                    {getRoleDisplayName(profileData.role)}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                    {profileData.role === 'TenantAdmin' && 'Full administrative access to tenant resources'}
                    {profileData.role === 'HqManager' && 'Manage headquarters operations and inventory'}
                    {profileData.role === 'HqStaff' && 'Access to headquarters operations'}
                    {profileData.role === 'BranchOwner' && 'Oversee branch operations and performance'}
                    {profileData.role === 'BranchManager' && 'Manage day-to-day branch activities'}
                    {profileData.role === 'StoreStaff' && 'Handle store operations and customer service'}
                  </Typography>
                </Box>
              </Box>

              {/* Branch Assignment */}
              {profileData.branchId && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <StorefrontRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                      Branch Assignment
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                      Branch ID: {profileData.branchId}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Account Created */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CalendarTodayRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    Account Created
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                    {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Tenant Information Card */}
          {user?.tenant && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                p: 3.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#6B4C2A',
                  mb: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Tenant Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Company Name */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <BusinessRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                      Company Name
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
                      {user.tenant.name}
                    </Typography>
                  </Box>
                </Box>

                {/* Subscription Tier */}
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.75 }}>
                    Subscription Tier
                  </Typography>
                  <Chip
                    label={user.tenant.subscriptionTier}
                    size="small"
                    sx={{
                      bgcolor: '#E8D3A9',
                      color: '#6B4C2A',
                      fontWeight: 700,
                      borderRadius: 2,
                      height: 28,
                    }}
                  />
                </Box>

                {/* Subscription Status */}
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.75 }}>
                    Subscription Status
                  </Typography>
                  <Chip
                    label={user.tenant.subscriptionStatus}
                    size="small"
                    sx={{
                      bgcolor:
                        user.tenant.subscriptionStatus === 'Active'
                          ? '#FEF3C7'
                          : user.tenant.subscriptionStatus === 'Trial'
                          ? '#DBEAFE'
                          : '#F3F4F6',
                      color:
                        user.tenant.subscriptionStatus === 'Active'
                          ? '#92400E'
                          : user.tenant.subscriptionStatus === 'Trial'
                          ? '#1E40AF'
                          : '#4B5563',
                      fontWeight: 700,
                      borderRadius: 2,
                      height: 28,
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
