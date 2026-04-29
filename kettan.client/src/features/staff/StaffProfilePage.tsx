import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
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
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { fetchEmployee, type EmployeeDto } from './staffApi';



export function StaffProfilePage() {
  const { staffId } = useParams({ from: '/layout/staff/$staffId' });
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const id = Number(staffId);
    if (Number.isNaN(id)) {
      setError('Invalid staff ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchEmployee(id)
      .then((employeeData) => {
        setEmployee(employeeData);
      })
      .catch(() => setError('Could not load staff profile.'))
      .finally(() => setLoading(false));
  }, [staffId]);

  const handleCopyEmployeeId = () => {
    if (employee?.userId) {
      navigator.clipboard.writeText(String(employee.userId));
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

  if (error || !employee) {
    return (
      <Box sx={{ pb: 5 }}>
        <BackButton to="/staff" />
        <Typography sx={{ mt: 3, color: 'text.secondary' }}>{error ?? 'Staff member not found.'}</Typography>
      </Box>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();

  return (
    <Box sx={{ pb: 5 }}>
      {/* Back navigation */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/staff" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Staff Profile
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              View staff member information and account details.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditRoundedIcon />}
          onClick={() => navigate({ to: `/staff/${staffId}/edit` })}
        >
          Edit Staff
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
            src={employee.imageUrl ?? undefined}
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
            {!employee.imageUrl ? initials : null}
          </Avatar>

          {/* Name & Position */}
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.01em' }}>
            {fullName}
          </Typography>

          <Chip
            icon={<BadgeRoundedIcon fontSize="small" />}
            label={employee.role}
            color="primary"
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              height: 32,
              fontSize: 13,
              mb: 3,
              bgcolor: '#E8D3A9',
              color: '#6B4C2A',
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
              {/* Employee ID */}
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                  Employee ID
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    ST-{String(employee.userId).padStart(4, '0')}
                  </Typography>
                  <Tooltip title={copySuccess ? 'Copied!' : 'Copy Employee ID'}>
                    <IconButton size="small" onClick={handleCopyEmployeeId} sx={{ p: 0.5 }}>
                      <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Status */}
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                  Employment Status
                </Typography>
                <Chip
                  label={employee.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    bgcolor: employee.isActive ? '#FEF3C7' : '#F3F4F6',
                    color: employee.isActive ? '#92400E' : '#4B5563',
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
                  {new Date(employee.createdAt).toLocaleDateString('en-US', {
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
              {employee.email && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <EmailRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                      Email Address
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: 'text.primary' }}>{employee.email}</Typography>
                  </Box>
                </Box>
              )}

              {/* Contact Number */}
              {employee.contactNo && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <PhoneRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                      Contact Number
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                      {employee.contactNo}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Birthday */}
              {employee.birthday && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <CakeRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                      Birthday
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                      {new Date(employee.birthday).toLocaleDateString('en-US', {
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

          {/* Employment & Access Card */}
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
              Employment &amp; Access
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Position */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <WorkRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    Role
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
                    {employee.role}
                  </Typography>
                </Box>
              </Box>

              {/* Branch Assignment */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <StorefrontRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    Branch Assignment
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                    {employee.branchName ?? 'Unassigned'}
                  </Typography>
                </Box>
              </Box>


              {/* Account Created */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CalendarTodayRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    Account Created
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: 'text.primary' }}>
                    {new Date(employee.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>


            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
