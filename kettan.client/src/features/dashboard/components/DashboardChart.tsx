import { Box, Typography, Card, MenuItem, Select, FormControl } from '@mui/material';
import SsidChartRoundedIcon from '@mui/icons-material/SsidChartRounded';

export function DashboardChart() {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SsidChartRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            System Analytics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <FormControl size="small" variant="outlined">
            <Select
              defaultValue="orders"
              sx={{ 
                height: 32, 
                fontSize: 12, 
                fontWeight: 500,
                borderRadius: 1.5,
                bgcolor: 'background.default',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
              }}
            >
              <MenuItem value="orders" sx={{ fontSize: 13 }}>Orders Fulfilled</MenuItem>
              <MenuItem value="inventory" sx={{ fontSize: 13 }}>Inventory Issues</MenuItem>
              <MenuItem value="returns" sx={{ fontSize: 13 }}>Return Requests</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" variant="outlined">
            <Select
              defaultValue="7days"
              sx={{ 
                height: 32, 
                fontSize: 12, 
                fontWeight: 500,
                borderRadius: 1.5,
                bgcolor: 'background.default',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
              }}
            >
              <MenuItem value="7days" sx={{ fontSize: 13 }}>Last 7 Days</MenuItem>
              <MenuItem value="30days" sx={{ fontSize: 13 }}>Last 30 Days</MenuItem>
              <MenuItem value="year" sx={{ fontSize: 13 }}>This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* ── Mock Line Chart via SVG ── */}
      <Box sx={{ flex: 1, minHeight: 200, width: '100%', position: 'relative', mt: 2 }}>
        <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((line) => (
            <line 
              key={line}
              x1="0" 
              y1={line * 37.5} 
              x2="500" 
              y2={line * 37.5} 
              stroke="#E5E7EB" 
              strokeWidth="1" 
              strokeDasharray="4 4" 
            />
          ))}

          {/* Area under the curve */}
          <path
            d="M 0 120 C 50 120, 80 80, 150 90 C 200 100, 250 40, 300 50 C 350 60, 400 110, 450 90 C 480 80, 500 50, 500 50 L 500 150 L 0 150 Z"
            fill="url(#chartGradient)"
            opacity="0.3"
          />

          {/* Line curve */}
          <path
            d="M 0 120 C 50 120, 80 80, 150 90 C 200 100, 250 40, 300 50 C 350 60, 400 110, 450 90 C 480 80, 500 50, 500 50"
            fill="none"
            stroke="#6B4C2A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {[
            { cx: 0, cy: 120 },
            { cx: 150, cy: 90 },
            { cx: 300, cy: 50 },
            { cx: 450, cy: 90 },
            { cx: 500, cy: 50 },
          ].map((point, index) => (
            <circle
              key={index}
              cx={point.cx}
              cy={point.cy}
              r="4"
              fill="#FFFFFF"
              stroke="#6B4C2A"
              strokeWidth="2"
            />
          ))}

          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8C6B43" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8C6B43" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* X Axis Labels */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, px: 1 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <Typography key={idx} sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
              {day}
            </Typography>
          ))}
        </Box>
      </Box>
    </Card>
  );
}
