import { Box, Card, Chip, Typography } from '@mui/material';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';

import {
  getSupplyRequestStatusLabel,
  SUPPLY_REQUEST_STATUS_COLORS,
} from './SupplyRequestDetail.constants';
import type { SupplyRequestTimelineEntry } from './SupplyRequestDetail.types';

interface SupplyRequestStatusTimelineProps {
  entries: SupplyRequestTimelineEntry[];
}

export function SupplyRequestStatusTimeline({ entries }: SupplyRequestStatusTimelineProps) {
  return (
    <Card elevation={0} sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
        <AccessTimeFilledRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Status Timeline</Typography>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {entries.map((entry, index) => {
          const statusColor = SUPPLY_REQUEST_STATUS_COLORS[entry.status];
          const isLast = index === entries.length - 1;

          return (
            <Box key={`${entry.status}-${entry.timestamp}-${index}`} sx={{ display: 'flex', gap: 2, mb: isLast ? 0 : 2.5, position: 'relative' }}>
              {!isLast ? (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 11,
                    top: 28,
                    bottom: -20,
                    width: 2,
                    bgcolor: 'divider',
                  }}
                />
              ) : null}

              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: statusColor.bg,
                  border: `2px solid ${statusColor.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor.color }} />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={getSupplyRequestStatusLabel(entry.status)}
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      bgcolor: statusColor.bg,
                      color: statusColor.color,
                      border: `1px solid ${statusColor.color}28`,
                    }}
                  />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {new Date(entry.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mt: 0.4 }}>{entry.actor}</Typography>

                {entry.remarks ? (
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
                    {entry.remarks}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
