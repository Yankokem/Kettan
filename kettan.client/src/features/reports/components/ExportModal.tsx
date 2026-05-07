import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Box, Typography, IconButton, 
  FormControl, Select, MenuItem,
  ToggleButtonGroup, ToggleButton,
  useTheme, useMediaQuery
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import { DateRangePicker } from '../../../components/UI/DateRangePicker';
import { Button } from '../../../components/UI/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { isBranchRole } from '../../../utils/roleHelpers';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  defaultStartDate: string;
  defaultEndDate: string;
}

export function ExportModal({ open, onClose, defaultStartDate, defaultEndDate }: ExportModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useAuthStore((s) => s.user);
  const isBranch = isBranchRole(user?.role ?? '');

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [reportType, setReportType] = useState('inventory');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/reports/${reportType}/export?startDate=${startDate}&endDate=${endDate}&format=${format}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${reportType}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, p: 2.5, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2E1F14' }}>
          Export Report
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 3, borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* Timeframe */}
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
              Select Timeframe
            </Typography>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
          </Box>

          {/* Report Data */}
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
              Select Report Data
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem value="inventory">Inventory Valuation</MenuItem>
                <MenuItem value="orders">Sales & Orders</MenuItem>
                <MenuItem value="returns">Returns & Losses</MenuItem>
                <MenuItem value="staff">Staff Performance</MenuItem>
                {!isBranch && <MenuItem value="audit-logs">System Audit Logs</MenuItem>}
                {isBranch && <MenuItem value="consumption">Consumption Record</MenuItem>}
              </Select>
            </FormControl>
          </Box>

          {/* Format */}
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
              Choose Format
            </Typography>
            <ToggleButtonGroup
              value={format}
              exclusive
              onChange={(_, v) => v && setFormat(v)}
              fullWidth
              sx={{ gap: 1 }}
            >
              <ToggleButton 
                value="pdf" 
                sx={{ 
                  flex: 1, borderRadius: '8px !important', border: '1px solid #ddd !important',
                  '&.Mui-selected': { bgcolor: 'rgba(107, 76, 42, 0.08)', color: '#6B4C2A', borderColor: '#6B4C2A !important' }
                }}
              >
                <DescriptionRoundedIcon sx={{ mr: 1, fontSize: 20 }} /> PDF
              </ToggleButton>
              <ToggleButton 
                value="csv" 
                sx={{ 
                  flex: 1, borderRadius: '8px !important', border: '1px solid #ddd !important',
                  '&.Mui-selected': { bgcolor: 'rgba(107, 76, 42, 0.08)', color: '#6B4C2A', borderColor: '#6B4C2A !important' }
                }}
              >
                <TableChartRoundedIcon sx={{ mr: 1, fontSize: 20 }} /> CSV
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button 
          fullWidth 
          variant="contained" 
          startIcon={<DownloadRoundedIcon />}
          onClick={handleExport}
          loading={loading}
          sx={{ height: 48, borderRadius: '12px' }}
        >
          Download {format.toUpperCase()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
