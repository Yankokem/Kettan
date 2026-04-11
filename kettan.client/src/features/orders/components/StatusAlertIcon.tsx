import { useState } from 'react';
import { Box, Typography, IconButton, Popover } from '@mui/material';
import WarningRoundedIcon from '@/components/icons/lucide-mui/WarningRoundedIcon';
import InfoRoundedIcon from '@/components/icons/lucide-mui/InfoRoundedIcon';
import ErrorRoundedIcon from '@/components/icons/lucide-mui/ErrorRoundedIcon';
import CheckCircleRoundedIcon from '@/components/icons/lucide-mui/CheckCircleRoundedIcon';

export type AlertSeverity = 'warning' | 'error' | 'info' | 'success';

export interface StatusAlertIconProps {
  severity: AlertSeverity;
  title: string;
  message: string;
}

export function StatusAlertIcon({ severity, title, message }: StatusAlertIconProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const config = {
    warning: { color: '#B45309', bgcolor: 'rgba(180,83,9,0.1)', icon: <WarningRoundedIcon fontSize="small" /> },
    error: { color: '#B91C1C', bgcolor: 'rgba(185,28,28,0.1)', icon: <ErrorRoundedIcon fontSize="small" /> },
    info: { color: '#1D4ED8', bgcolor: 'rgba(29,78,216,0.1)', icon: <InfoRoundedIcon fontSize="small" /> },
    success: { color: '#546B3F', bgcolor: 'rgba(84,107,63,0.1)', icon: <CheckCircleRoundedIcon fontSize="small" /> },
  }[severity];

  return (
    <>
      <IconButton
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        onClick={handlePopoverOpen}
        sx={{
          color: config.color,
          bgcolor: config.bgcolor,
          '&:hover': { bgcolor: config.bgcolor },
          width: 36,
          height: 36,
        }}
      >
        {config.icon}
      </IconButton>
      <Popover
        id="mouse-over-popover"
        sx={{ pointerEvents: 'none', mt: 1 }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Box sx={{ p: 2, maxWidth: 320, borderTop: `4px solid ${config.color}`, bgcolor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: config.color, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
            {message}
          </Typography>
        </Box>
      </Popover>
    </>
  );
}


