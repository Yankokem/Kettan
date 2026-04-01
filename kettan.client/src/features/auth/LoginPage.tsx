import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import loginBg from '../../assets/login-bg.jpg';
import logo from '../../assets/logo.png';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from '@tanstack/react-router';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Determine exact role based on email mock
    let userRole = 'SuperAdmin';
    const emailLower = email.toLowerCase();
    
    if (emailLower.includes('superadmin')) { userRole = 'SuperAdmin'; } 
    else if (emailLower.includes('tenantadmin')) { userRole = 'TenantAdmin'; } 
    else if (emailLower.includes('owner')) { userRole = 'BranchOwner'; } 
    else if (emailLower.includes('hqmanager')) { userRole = 'HqManager'; } 
    else if (emailLower.includes('manager')) { userRole = 'BranchManager'; } 
    else if (emailLower.includes('hqstaff')) { userRole = 'HqStaff'; }

    login(
      { 
        id: '1', 
        email: email, 
        name: email.split('@')[0] || 'User', 
        role: userRole 
      }, 
      'dummy-jwt-token'
    );
    
    navigate({ to: '/' });
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#fff' }}>
      
      {/*  Left Side: Branding & Background  */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: 6,
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(250, 245, 239, 0.88)',
            zIndex: 1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
            zIndex: 1
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            component="img"
            src={logo}
            alt="Kettan Logo"
            sx={{ 
                width: 520, 
                maxWidth: '100%',
                mb: 5,
                filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.15))'
            }}
          />
          <Typography 
            variant="h5" 
            component="h1"
            sx={{ 
                fontFamily: "'Playfair Display', 'Cinzel', 'Merriweather', 'Times New Roman', serif",
                color: '#8A633E', 
                fontWeight: 600,
                letterSpacing: 0.5,
                mb: 2,
            }}
          >
            The Future of Distribution Management
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
                color: '#9E8873', 
                fontWeight: 500,
                lineHeight: 1.6,
                maxWidth: '85%'
            }}
          >
            Seamlessly control your inventory, track orders, and collaborate with branches across the globe on a single platform.
          </Typography>
        </Box>
      </Box>

      {/*  Right Side: Solid Login Form  */}
      <Box
        sx={{
          width: { xs: '100%', md: 520 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 4, sm: 8 },
          py: 6,
          backgroundColor: '#FAF5EF',
          boxShadow: { md: '-8px 0 24px rgba(0,0,0,0.1)' },
          zIndex: 2,
        }}
      >
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
          <img src={logo} alt="Kettan Logo" style={{ height: 50 }} />
        </Box>

        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E1914', mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Please enter your account details to sign in.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            sx={{ mb: 2.5 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 4 }}>
            <FormControlLabel
              control={<Checkbox value="remember" sx={{ color: '#C9A84C', '&.Mui-checked': { color: '#C9A84C' } }} />}
              label={<Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Remember me</Typography>}
            />
            <Link href="#" variant="body2" sx={{ color: '#6B4C2A', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disableElevation
            sx={{
              py: 1.6,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#1E1914',
              color: '#fff',
              '&:hover': { backgroundColor: '#352C23' },
            }}
          >
            Sign In to Kettan
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
