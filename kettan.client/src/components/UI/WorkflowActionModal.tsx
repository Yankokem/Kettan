import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, IconButton } from '@mui/material';
import { Button } from './Button';
import { TextField } from './TextField';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useState, useEffect } from 'react';

export type WorkflowSeverity = 'danger' | 'warning' | 'info' | 'success';

export interface WorkflowActionModalProps {
  open: boolean;
  title: string;
  description: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: WorkflowSeverity;
  loading?: boolean;
  requireInput?: boolean;
  onConfirm: (message: string) => void;
  onCancel: () => void;
}

export function WorkflowActionModal({
  open,
  title,
  description,
  inputLabel = 'Comments',
  inputPlaceholder = 'Enter details here...',
  confirmLabel = 'Submit',
  cancelLabel = 'Cancel',
  severity = 'info',
  loading = false,
  requireInput = false,
  onConfirm,
  onCancel,
}: WorkflowActionModalProps) {
  const [inputValue, setInputValue] = useState('');

  // Reset input field when the modal is closed or opened
  useEffect(() => {
    if (!open) {
      setInputValue('');
    }
  }, [open]);

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
      case 'success':
        return {
          icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 32, color: '#2E7D32' }} />,
          bgColor: '#E8F5E9',
          buttonColor: 'success' as const,
          accentColor: '#2E7D32',
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
  const isConfirmDisabled = requireInput && !inputValue.trim();

  const handleConfirmSubmit = () => {
    onConfirm(inputValue);
  };

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
        },
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

      <DialogTitle component="div" sx={{ pt: 4, px: 4, pb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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

      <DialogContent sx={{ px: 4, pb: 3 }}>
        <Typography
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            fontWeight: 500,
            lineHeight: 1.6,
            fontSize: 15,
            mb: 3,
          }}
        >
          {description}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {inputLabel && (
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', ml: 0.5 }}>
              {inputLabel} {requireInput && <span style={{ color: '#D32F2F' }}>*</span>}
            </Typography>
          )}
          <TextField
            multiline
            rows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: 80,
              },
            }}
          />
        </Box>
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
          onClick={handleConfirmSubmit}
          disabled={isConfirmDisabled}
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
