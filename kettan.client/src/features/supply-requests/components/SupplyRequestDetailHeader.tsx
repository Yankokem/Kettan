import { Box, Chip, Typography } from '@mui/material';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../../components/UI/BackButton';
import { Button } from '../../../components/UI/Button';
import {
  getSupplyRequestStatusLabel,
  SUPPLY_REQUEST_STATUS_COLORS,
} from './SupplyRequestDetail.constants';
import type { SupplyRequestLifecycleStatus } from './SupplyRequestDetail.types';

interface SupplyRequestDetailHeaderProps {
  requestId: string;
  requestNumber: string;
  status: SupplyRequestLifecycleStatus;
  branchName: string;
}

export function SupplyRequestDetailHeader({
  requestId,
  requestNumber,
  status,
  branchName,
}: SupplyRequestDetailHeaderProps) {
  const navigate = useNavigate();
  const isDraft = status === 'Draft' || status === 'AutoDrafted';
  const isDelivered = status === 'Delivered';
  const isAwaitingDelivery = status === 'Dispatched' || status === 'InTransit';
  const statusColor = SUPPLY_REQUEST_STATUS_COLORS[status];

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/supply-requests" />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {requestNumber}
            </Typography>
            <Chip
              label={getSupplyRequestStatusLabel(status)}
              icon={status === 'PendingApproval' ? <AccessTimeFilledRoundedIcon sx={{ fontSize: 14 }} /> : undefined}
              size="small"
              sx={{
                fontSize: 12,
                fontWeight: 600,
                bgcolor: statusColor.bg,
                color: statusColor.color,
                border: `1px solid ${statusColor.color}28`,
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Requested by <strong>{branchName}</strong>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
        {isDraft ? (
          <>
            <Button
              variant="outlined"
              startIcon={<EditRoundedIcon />}
              onClick={() => navigate({ to: '/supply-requests/$requestId/edit', params: { requestId } })}
            >
              Edit Draft
            </Button>
            <Button startIcon={<SendRoundedIcon />}>Submit to HQ</Button>
          </>
        ) : null}

        {status === 'PendingApproval' ? (
          <Chip
            label="Awaiting HQ Review"
            variant="outlined"
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          />
        ) : null}

        {isAwaitingDelivery ? (
          <Button startIcon={<CheckCircleRoundedIcon />}>Confirm Delivery</Button>
        ) : null}

        {isDelivered ? (
          <>
            <Button variant="outlined" startIcon={<AssignmentReturnRoundedIcon />} sx={{ color: '#B45309', borderColor: '#B45309' }}>
              File Return
            </Button>
          </>
        ) : null}
      </Box>
    </Box>
  );
}
