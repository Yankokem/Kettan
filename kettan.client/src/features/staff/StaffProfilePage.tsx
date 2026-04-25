import { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Box, Typography, Grid, Paper, Avatar, Divider, Chip, CircularProgress } from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import { BackButton } from '../../components/UI/BackButton';
import { fetchEmployee, type EmployeeDto } from './staffApi';

export function StaffProfilePage() {
  const { staffId } = useParams({ from: '/layout/staff/$staffId' });
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(staffId);
    if (Number.isNaN(id)) {
      setError('Invalid staff ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchEmployee(id)
      .then((data) => setEmployee(data))
      .catch(() => setError('Could not load staff profile.'))
      .finally(() => setLoading(false));
  }, [staffId]);

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
      <Box sx={{ mb: 3 }}>
        <BackButton to="/staff" />
      </Box>

      {/* Header Profile Section */}
      <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Avatar
          src={employee.imageUrl ?? undefined}
          variant="rounded"
          sx={{
            width: 140,
            height: 140,
            bgcolor: '#FAF5EF',
            borderRadius: 4,
            color: '#6B4C2A',
            border: '2px solid',
            borderColor: 'divider',
            fontSize: 52,
            fontWeight: 700,
          }}
        >
          {!employee.imageUrl ? (
            initials || <PersonRoundedIcon sx={{ fontSize: 70 }} />
          ) : null}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            {fullName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
            <Chip
              icon={<BadgeRoundedIcon fontSize="small" />}
              label={employee.position}
              size="small"
              sx={{ bgcolor: '#E8D3A9', color: '#6B4C2A', fontWeight: 700, borderRadius: 2, height: 28 }}
            />
            <Chip
              label={employee.isActive ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                bgcolor: employee.isActive ? '#FEF3C7' : '#F3F4F6',
                color: employee.isActive ? '#92400E' : '#4B5563',
                fontWeight: 700,
                borderRadius: 2,
                height: 28,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              ID: ST-{String(employee.employeeId).padStart(4, '0')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Info Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#6B4C2A', mb: 2.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Contact &amp; Assignment
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {employee.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EmailRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{employee.email}</Typography>
                </Box>
              )}
              {employee.contactNumber && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PersonRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{employee.contactNumber}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <StorefrontRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                <Typography sx={{ fontSize: 14, color: 'text.primary' }}>
                  {employee.branchName ?? 'Unassigned'}
                </Typography>
              </Box>
              {employee.dateHired && (
                <>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarTodayRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                      Hired: {new Date(employee.dateHired).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#6B4C2A', mb: 2.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Position Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Full Name</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{fullName}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Position</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{employee.position}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Status</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: employee.isActive ? '#6B4C2A' : '#4B5563' }}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Member Since</Typography>
                <Typography sx={{ fontSize: 14 }}>
                  {new Date(employee.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
