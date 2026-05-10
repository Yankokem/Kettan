import { Box, Typography, Popover, TextField } from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { useState } from 'react';
import { Button } from './Button';

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'date-range-popover' : undefined;

  // Formatting date for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayString = startDate && endDate 
    ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}` 
    : 'Select Date Range';

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 20, color: '#6B4C2A' }} />}
        onClick={handleClick}
        sx={{
          minWidth: 220,
          justifyContent: 'flex-start',
          bgcolor: 'transparent',
          color: '#6B4C2A',
          fontWeight: 600,
          fontSize: 13,
          px: 2,
          borderColor: 'rgba(107, 76, 42, 0.3)',
          '&:hover': {
            bgcolor: 'rgba(107, 76, 42, 0.04)',
            borderColor: '#6B4C2A',
          }
        }}
      >
        {displayString}
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 0,
          sx: { 
            mt: 1, 
            p: 2.5, 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: '14px',
            bgcolor: '#FAF5EF', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2, 
            minWidth: 320,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Custom Date Range</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            id="start-date"
            name="start-date"
            label="Start Date"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
            InputLabelProps={{ shrink: true, sx: { fontSize: 13, fontWeight: 500 } }}
            inputProps={{ sx: { fontSize: 13, fontWeight: 500 } }}
            sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider', borderRadius: '14px' } }}
          />
          <TextField
            id="end-date"
            name="end-date"
            label="End Date"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value)}
            InputLabelProps={{ shrink: true, sx: { fontSize: 13, fontWeight: 500 } }}
            inputProps={{ sx: { fontSize: 13, fontWeight: 500 } }}
            sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider', borderRadius: '14px' } }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button variant="contained" onClick={handleClose} sx={{ height: 36, px: 3 }}>
            Apply View
          </Button>
        </Box>
      </Popover>
    </>
  );
}