import { Box, Typography } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../../components/UI/BackButton';
import { Button } from '../../../components/UI/Button';
import type { SupplyRequestLifecycleStatus } from './SupplyRequestDetail.types';

export interface SupplyRequestDetailHeaderProps {
  requestId: string;
  requestNumber: string;
  status: SupplyRequestLifecycleStatus;
  branchName: string;
  role: string;
  isSubmitting?: boolean;
  onSubmitDraft?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onFileReturn?: () => void;
  onConfirmArrival?: () => void;
  onCompleteTransaction?: () => void;
}

export function SupplyRequestDetailHeader({
  requestId,
  status,
  branchName,
  role,
  isSubmitting,
  onSubmitDraft,
  onApprove,
  onReject,
  onCancel,
  onFileReturn,
  onConfirmArrival,
  onCompleteTransaction,
}: SupplyRequestDetailHeaderProps) {
  const navigate = useNavigate();

  const isHq = ['TenantAdmin', 'HqManager', 'HqStaff'].includes(role);
  const isBranch = ['BranchManager', 'BranchOwner'].includes(role);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BackButton to="/supply-requests" size="small" />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Replenishment Tracking
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.2 }}>
            View and manage branch replenishment request for <strong>{branchName}</strong>.
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
          <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={onCancel} disabled={isSubmitting}>
            Cancel Request
          </Button>
        )}
        {status === 'PendingApproval' && isHq && (
          <>
            <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={onReject} disabled={isSubmitting}>
              Reject
            </Button>
            <Button color="success" startIcon={<CheckCircleRoundedIcon />} onClick={onApprove} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Generating Order...' : 'Approve'}
            </Button>
          </>
        )}

        {/* Approved -> Move to Picking (HQ only) */}
        {status !== 'PendingApproval' && status !== 'Draft' && status !== 'AutoDrafted' && status !== 'Cancelled' && status !== 'Rejected' && status !== 'Dispatched' && isHq && (
          <Button variant="outlined" startIcon={<TaskAltRoundedIcon />} onClick={() => navigate({ to: '/orders' })}>
            View Order Processing
          </Button>
        )}

        {/* Package Arrived button for branch users when status is Dispatched */}
        {status === 'Dispatched' && isBranch && (
          <Button color="success" startIcon={<CheckCircleRoundedIcon />} onClick={onConfirmArrival} loading={isSubmitting} disabled={isSubmitting}>
            Package Arrived
          </Button>
        )}

        {/* Complete Transaction button for branch users when status is Arrived */}
        {status === 'Arrived' && isBranch && (
          <Button color="success" startIcon={<CheckCircleRoundedIcon />} onClick={onCompleteTransaction} loading={isSubmitting} disabled={isSubmitting}>
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
