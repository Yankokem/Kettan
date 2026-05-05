import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, IconButton } from '@mui/material';
import { Button } from './Button';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export type ConfirmationSeverity = 'danger' | 'warning' | 'info';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: ConfirmationSeverity;
  loading?: boolean;
}

export function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  severity = 'info',
  loading = false,
}: ConfirmationModalProps) {

  const getSeverityConfig = () => {
    switch (severity) {
      case 'danger':
        return {
          icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 32, color: '#D32F2F' }} />,
          bgColor: '#FFEBEE',
          buttonColor: 'error' as const,
          accentColor: '#D32F2F',
        };
      case 'warning':
        return {
          icon: <WarningAmberRoundedIcon sx={{ fontSize: 32, color: '#ED6C02' }} />,
          bgColor: '#FFF3E0',
          buttonColor: 'warning' as const,
          accentColor: '#ED6C02',
        };
      case 'info':
      default:
        return {
          icon: <InfoOutlinedIcon sx={{ fontSize: 32, color: '#0288D1' }} />,
          bgColor: '#E1F5FE',
          buttonColor: 'primary' as const,
          accentColor: '#0288D1',
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          padding: '8px',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }
      }}
    >
      <IconButton
        onClick={onCancel}
        disabled={loading}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      <DialogTitle sx={{ pt: 4, px: 4, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '18px',
            bgcolor: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          {config.icon}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', color: 'text.primary' }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 4 }}>
        <Typography
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            fontWeight: 500,
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 0, display: 'flex', gap: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={loading}
          sx={{
            height: 48,
            borderRadius: '12px',
            borderColor: 'divider',
            fontWeight: 700,
            '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' },
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          fullWidth
          variant="contained"
          color={config.buttonColor}
          onClick={onConfirm}
          loading={loading}
          sx={{
            height: 48,
            borderRadius: '12px',
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
