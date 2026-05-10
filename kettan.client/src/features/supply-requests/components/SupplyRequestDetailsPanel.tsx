import type { ReactNode } from 'react';
import { Box, Card, Chip, Typography } from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';

import type { SupplyRequestDetailViewModel } from './SupplyRequestDetail.types';

interface SupplyRequestDetailsPanelProps {
  request: SupplyRequestDetailViewModel;
}

function DetailField({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
        {icon}
        <Typography
          sx={{
            fontSize: 11.5,
            color: '#6B4C2A',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ ml: 3.5 }}>{children}</Box>
    </Box>
  );
}

export function SupplyRequestDetailsPanel({ request }: SupplyRequestDetailsPanelProps) {
  const formatScheduleStatus = (status?: string) => {
    if (!status) return 'No Schedule';
    if (status === 'DueToday') return 'Due Today';
    if (status === 'NoSchedule') return 'No Schedule';
    if (status === 'OnTime') return 'On Time';
    return status;
  };

  const scheduleColor = (status?: string) => {
    if (status === 'Late') return '#D32F2F';
    if (status === 'DueToday') return '#ED6C02';
    if (status === 'OnTime') return '#2E7D32';
    if (status === 'Scheduled') return '#0288D1';
    return '#6B7280';
  };

  const toPeso = (value?: number) =>
    `₱${(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}>
      <Box sx={{ 
        p: 2.2, 
        background: 'linear-gradient(170deg, #F0E6D3 0%, #FAF5EF 100%)', 
        borderBottom: '1px solid', 
        borderColor: 'divider' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
          <DescriptionRoundedIcon sx={{ color: '#6B4C2A', fontSize: 18 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Request Details</Typography>
        </Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>{request.requestNumber}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', mt: -0.5 }}>{request.branchName}</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2.5, gap: 3 }}>
        {/* Details Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <DetailField icon={<PriorityHighRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Priority">
            <Chip label={request.priority} size="small" sx={{ fontSize: 11.5, fontWeight: 600 }} />
          </DetailField>

          <DetailField icon={<CategoryRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Request Type">
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{request.requestType}</Typography>
          </DetailField>

          <DetailField icon={<DescriptionRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Subject">
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: request.subject ? 'text.primary' : 'text.secondary' }}>
              {request.subject || 'No subject'}
            </Typography>
          </DetailField>

          <DetailField icon={<ScheduleRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Dispatch Window">
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{request.dispatchWindow}</Typography>
          </DetailField>

          <DetailField icon={<ScheduleRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Dispatch SLA">
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: scheduleColor(request.dispatchScheduleStatus) }}>
              {formatScheduleStatus(request.dispatchScheduleStatus)}
            </Typography>
          </DetailField>

          <DetailField icon={<PriorityHighRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Value Summary">
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#6B4C2A' }}>
              Requested: {toPeso(request.totalRequestedValue)}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              Approved: {toPeso(request.totalApprovedValue)}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              Fulfilled: {toPeso(request.totalFulfilledValue)}
            </Typography>
          </DetailField>
        </Box>

        {/* Workflow Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <DetailField icon={<PersonOutlineRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Requested By">
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
              {request.requestedByName}
              <Typography component="span" sx={{ fontSize: 12, color: 'text.disabled', ml: 0.5 }}>
                ({request.requestedByRole})
              </Typography>
            </Typography>
          </DetailField>

          <DetailField icon={<EventRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />} label="Submitted At">
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{request.submittedAtLabel}</Typography>
          </DetailField>
        </Box>

        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StickyNote2RoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
            <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notes
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: '#334155' }}>
            {request.notes || 'No additional notes.'}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
