import { Box, Chip, Typography } from '@mui/material';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../../components/UI/BackButton';
import { Button } from '../../../components/UI/Button';
import {
  getSupplyRequestStatusLabel,
  SUPPLY_REQUEST_STATUS_COLORS,
} from './SupplyRequestDetail.constants';
import type { SupplyRequestLifecycleStatus } from './SupplyRequestDetail.types';

export interface SupplyRequestDetailHeaderProps {
  requestId: string;
  requestNumber: string;
  status: SupplyRequestLifecycleStatus;
  branchName: string;
  role: string;
  isSubmitting?: boolean;
  canSubmitPicking?: boolean;
  canDispatch?: boolean;
  canComplete?: boolean;
  onSubmitDraft?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onBeginPicking?: () => void;
  onSubmitPicking?: () => void;
  onSubmitPacking?: () => void;
  onDispatch?: () => void;
  onConfirmArrival?: () => void;
  onComplete?: () => void;
  onFileReturn?: () => void;
}

export function SupplyRequestDetailHeader({
  requestId,
  requestNumber,
  status,
  branchName,
  role,
  isSubmitting,
  canSubmitPicking,
  canDispatch,
  canComplete,
  onSubmitDraft,
  onApprove,
  onReject,
  onBeginPicking,
  onSubmitPicking,
  onSubmitPacking,
  onDispatch,
  onConfirmArrival,
  onComplete,
  onFileReturn,
}: SupplyRequestDetailHeaderProps) {
  const navigate = useNavigate();
  const statusColor = SUPPLY_REQUEST_STATUS_COLORS[status] || { color: '#64748B', bg: 'rgba(100,116,139,0.12)' };

  const isHq = ['TenantAdmin', 'HqManager', 'HqStaff'].includes(role);
  const isBranch = ['BranchManager', 'BranchOwner'].includes(role);

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
        
        {/* Branch: Draft Actions */}
        {(status === 'Draft' || status === 'AutoDrafted') && isBranch && (
          <>
            <Button
              variant="outlined"
              startIcon={<EditRoundedIcon />}
              onClick={() => navigate({ to: '/supply-requests/$requestId/edit', params: { requestId } })}
              disabled={isSubmitting}
            >
              Edit Draft
            </Button>
            <Button startIcon={<SendRoundedIcon />} onClick={onSubmitDraft} disabled={isSubmitting}>
              Submit to HQ
            </Button>
          </>
        )}

        {/* Pending Approval */}
        {status === 'PendingApproval' && isBranch && (
          <Chip label="Awaiting HQ Review" variant="outlined" sx={{ fontWeight: 600, color: 'text.secondary' }} />
        )}
        {status === 'PendingApproval' && isHq && (
          <>
            <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={onReject} disabled={isSubmitting}>
              Reject
            </Button>
            <Button color="success" startIcon={<CheckCircleRoundedIcon />} onClick={onApprove} disabled={isSubmitting}>
              Approve
            </Button>
          </>
        )}

        {/* Approved -> Move to Picking */}
        {(status === 'Approved' || status === 'PartiallyApproved' || status === 'Processing') && isHq && (
           <Button startIcon={<Inventory2RoundedIcon />} onClick={onBeginPicking} disabled={isSubmitting}>
             Begin Picking
           </Button>
        )}

        {/* Picking */}
        {status === 'Picking' && isHq && (
          <Button startIcon={<CheckCircleRoundedIcon />} onClick={onSubmitPicking} disabled={isSubmitting || !canSubmitPicking}>
            Submit Picking
          </Button>
        )}

        {/* Packing / Packed */}
        {(status === 'Packing' || status === 'Packed') && isHq && (
          <>
            <Button variant="outlined" startIcon={<TaskAltRoundedIcon />} onClick={onSubmitPacking} disabled={isSubmitting}>
              Save Packing
            </Button>
            <Button startIcon={<LocalShippingRoundedIcon />} onClick={onDispatch} disabled={isSubmitting || !canDispatch}>
              Dispatch Order
            </Button>
          </>
        )}

        {/* Dispatched / In Transit */}
        {(status === 'Dispatched' || status === 'InTransit') && isHq && (
          <Chip label="Awaiting Branch Confirmation" variant="outlined" sx={{ fontWeight: 600, color: 'text.secondary' }} />
        )}
        {(status === 'Dispatched' || status === 'InTransit') && isBranch && (
          <Button startIcon={<TaskAltRoundedIcon />} onClick={onConfirmArrival} disabled={isSubmitting}>
            Package Arrived
          </Button>
        )}

        {/* Arrived */}
        {status === 'Arrived' && isHq && (
          <Chip label="Awaiting Branch Completion" variant="outlined" sx={{ fontWeight: 600, color: 'text.secondary' }} />
        )}
        {status === 'Arrived' && isBranch && (
          <Button color="success" startIcon={<CheckCircleRoundedIcon />} onClick={onComplete} disabled={isSubmitting || !canComplete}>
            Complete Transaction
          </Button>
        )}

        {/* Completed / Delivered */}
        {(status === 'Completed' || status === 'Delivered') && isBranch && (
           <Button
             variant="outlined"
             startIcon={<AssignmentReturnRoundedIcon />}
             onClick={onFileReturn}
             sx={{ color: '#B45309', borderColor: '#B45309' }}
           >
             File Return
           </Button>
        )}

      </Box>
    </Box>
  );
}
