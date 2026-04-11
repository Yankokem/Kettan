import { Box, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@/components/icons/lucide-mui/CheckCircleRoundedIcon';
import RadioButtonUncheckedRoundedIcon from '@/components/icons/lucide-mui/RadioButtonUncheckedRoundedIcon';
import AdjustRoundedIcon from '@/components/icons/lucide-mui/AdjustRoundedIcon';

export interface TimelineEvent {
  title: string;
  timestamp?: string;
  subtitle?: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface StatusTimelineProps {
  events: TimelineEvent[];
}

export function StatusTimeline({ events }: StatusTimelineProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        
        let Icon = RadioButtonUncheckedRoundedIcon;
        let iconColor = 'text.disabled';
        
        if (event.status === 'completed') {
          Icon = CheckCircleRoundedIcon;
          iconColor = 'success.main';
        } else if (event.status === 'current') {
          Icon = AdjustRoundedIcon;
          iconColor = 'primary.main';
        }
        
        return (
          <Box key={index} sx={{ display: 'flex', flexDirection: 'row' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
              <Icon sx={{ color: iconColor }} />
              {!isLast && (
                <Box
                  sx={{
                    width: '2px',
                    flexGrow: 1,
                    bgcolor: event.status === 'completed' ? 'success.main' : 'divider',
                    my: 0.5,
                    minHeight: '40px'
                  }}
                />
              )}
            </Box>
            <Box sx={{ pb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: event.status === 'current' ? 700 : 500, color: event.status === 'upcoming' ? 'text.secondary' : 'text.primary' }}>
                {event.title}
              </Typography>
              {event.timestamp && (
                <Typography variant="body2" color="text.secondary">
                  {event.timestamp}{event.subtitle ? ` — ${event.subtitle}` : ''}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}


