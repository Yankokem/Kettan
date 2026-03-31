import React from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | null;
  trendValue?: string;
  icon: React.ReactNode;
  accentClass: string;
  iconBg: string;
}

export function StatCard({ label, value, sub, trend, trendValue, icon, accentClass, iconBg }: StatCardProps) {
  return (
    <Box
      className={`hover-lift glass-card ${accentClass}`}
      sx={{
        borderRadius: '14px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        cursor: 'default',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
              {sub}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '11px',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '& svg': { fontSize: 22, color: '#FAF5EF' },
          }}
        >
          {icon}
        </Box>
      </Box>

      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          {trend === 'up'
            ? <TrendingUpRoundedIcon sx={{ fontSize: 14, color: '#546B3F' }} />
            : <TrendingDownRoundedIcon sx={{ fontSize: 14, color: '#B91C1C' }} />
          }
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: trend === 'up' ? '#546B3F' : '#B91C1C',
            }}
          >
            {trendValue}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
            vs last week
          </Typography>
        </Box>
      )}
    </Box>
  );
}
