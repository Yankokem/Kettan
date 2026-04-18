import type { ReactNode } from 'react';
import { Box, Card, Chip, Typography } from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';

import {
  getSupplyRequestStatusLabel,
  SUPPLY_REQUEST_STATUS_COLORS,
} from './SupplyRequestDetail.constants';
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
            color: 'text.secondary',
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
  const statusColor = SUPPLY_REQUEST_STATUS_COLORS[request.status];

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
        <DescriptionRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Request Details</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2.5, gap: 2.5 }}>
        <DetailField icon={<TagRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Request ID">
          <Chip
            label={request.requestNumber}
            size="small"
            sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: '#e2e8f0', color: '#1e293b', borderRadius: 1 }}
          />
        </DetailField>

        <DetailField icon={<StorefrontRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Branch">
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{request.branchName}</Typography>
        </DetailField>

        <DetailField icon={<PriorityHighRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Priority">
          <Chip label={request.priority} size="small" sx={{ fontSize: 11.5, fontWeight: 600 }} />
        </DetailField>

        <DetailField icon={<CategoryRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Request Type">
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{request.requestType}</Typography>
        </DetailField>

        <DetailField icon={<ScheduleRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Dispatch Window">
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{request.dispatchWindow}</Typography>
        </DetailField>

        <DetailField icon={<EventRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Submitted">
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{request.submittedAtLabel}</Typography>
        </DetailField>

        <DetailField icon={<PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Requested By">
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
            {request.requestedByName}
            <Typography component="span" sx={{ fontSize: 13, color: 'text.disabled', ml: 0.5 }}>
              ({request.requestedByRole})
            </Typography>
          </Typography>
        </DetailField>

        <DetailField icon={<InfoRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Status">
          <Chip
            label={getSupplyRequestStatusLabel(request.status)}
            size="small"
            sx={{
              fontSize: 12,
              fontWeight: 600,
              bgcolor: statusColor.bg,
              color: statusColor.color,
              border: `1px solid ${statusColor.color}28`,
            }}
          />
        </DetailField>

        {request.linkedOrderId ? (
          <DetailField icon={<LinkRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />} label="Linked Order">
            <Chip
              label={request.linkedOrderId}
              size="small"
              clickable
              sx={{
                fontWeight: 700,
                fontFamily: 'monospace',
                fontSize: 12,
                bgcolor: 'rgba(37,99,235,0.1)',
                color: '#2563EB',
                border: '1px solid rgba(37,99,235,0.25)',
                '&:hover': { bgcolor: 'rgba(37,99,235,0.18)' },
              }}
            />
          </DetailField>
        ) : null}

        <Box sx={{ bgcolor: 'rgba(241,245,249,0.6)', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StickyNote2RoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notes
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: '#334155' }}>{request.notes}</Typography>
        </Box>
      </Box>
    </Card>
  );
}
