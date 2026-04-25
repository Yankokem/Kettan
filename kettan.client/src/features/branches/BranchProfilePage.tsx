import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Button } from '../../components/UI/Button';
import {
  BRANCH_MANAGER_OPTIONS,
  BRANCH_OWNER_OPTIONS,
  BRANCHES_MOCK,
} from './mockData';
import {
  BRANCH_PROFILE_TABS,
  getKpisForTab,
  isOpenNow,
  mapActivityLog,
  mapBranch,
  mapEmployee,
  mapInventoryItem,
  mapTransaction,
  toBranchFormData,
} from './branchProfileData';
import {
  fetchBranch,
  fetchBranchActivity,
  fetchBranchInventory,
  fetchBranchStaff,
  fetchBranchTransactions,
} from './branchesApi';
import { BranchProfileHero } from './components/profile/BranchProfileHero';
import { BranchProfileTabHeader } from './components/profile/BranchProfileTabHeader';
import { BranchDetailsTab } from './components/profile/BranchDetailsTab';
import { BranchStaffTab } from './components/profile/BranchStaffTab';
import { BranchActivityTab } from './components/profile/BranchActivityTab';
import { BranchTransactionsTab } from './components/profile/BranchTransactionsTab';
import { BranchInventoryTab } from './components/profile/BranchInventoryTab';
import { BranchEditModal } from './components/profile/BranchEditModal.tsx';
import { AddStaffModal, type AddStaffFormValues } from '../staff/components/AddStaffModal.tsx';
import type { BranchEmployee, BranchFormData, BranchProfileTabKey } from './types';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Operational)' },
  { value: 'setup', label: 'Setup Pending' },
];

const OWNER_OPTIONS = [
  { value: '', label: 'Unassigned (Optional)' },
  ...BRANCH_OWNER_OPTIONS,
];

const MANAGER_OPTIONS = [
  { value: '', label: 'Select a manager...' },
  ...BRANCH_MANAGER_OPTIONS,
];

const STAFF_ROLE_TO_POSITION: Record<Exclude<AddStaffFormValues['role'], ''>, string> = {
  hq: 'HQ Executive',
  manager: 'Branch Manager',
  staff: 'Store Staff',
};

export function BranchProfilePage() {
  const navigate = useNavigate();
  const { branchId } = useParams({ from: '/layout/branches/$branchId' });

  const parsedBranchId = Number(branchId);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [staffMembers, setStaffMembers] = useState<BranchEmployee[]>([]);
  const [activityLogs, setActivityLogs] = useState<BranchActivityLog[]>([]);
  const [transactions, setTransactions] = useState<BranchTransactionRow[]>([]);
  const [inventoryItems, setInventoryItems] = useState<BranchInventoryItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BranchProfileTabKey>('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [showSavedNotice, setShowSavedNotice] = useState(false);
  
  const [formData, setFormData] = useState<BranchFormData | null>(null);
  const [editDraft, setEditDraft] = useState<BranchFormData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [branchDto, staffDto, activityDto, transDto, invDto] = await Promise.all([
        fetchBranch(parsedBranchId),
        fetchBranchStaff(parsedBranchId),
        fetchBranchActivity(parsedBranchId),
        fetchBranchTransactions(parsedBranchId),
        fetchBranchInventory(parsedBranchId),
      ]);

      const branch = mapBranch(branchDto);
      setSelectedBranch(branch);
      setStaffMembers(staffDto.map(mapEmployee));
      setActivityLogs(activityDto.map(mapActivityLog));
      setTransactions(transDto.map(mapTransaction));
      setInventoryItems(invDto.map(mapInventoryItem));
      
      const initialFormData = toBranchFormData(branch);
      setFormData(initialFormData);
      setEditDraft(initialFormData);
    } catch (error) {
      console.error('Failed to load branch profile:', error);
    } finally {
      setLoading(false);
    }
  }, [parsedBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!showSavedNotice) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setShowSavedNotice(false);
    }, 2200);

    return () => clearTimeout(timeoutHandle);
  }, [showSavedNotice]);

  const branchCode = selectedBranch ? `BR-${selectedBranch.id.toString().padStart(5, '0')}` : '';
  const branchOpen = formData ? isOpenNow(formData.openTime, formData.closeTime) : false;

  const cityOptions = useMemo(() => {
    const knownCities = Array.from(new Set(BRANCHES_MOCK.map((branch) => branch.city).filter(Boolean)));
    if (editDraft?.city && !knownCities.includes(editDraft.city)) {
      knownCities.push(editDraft.city);
    }

    return knownCities.map((city) => ({ value: city, label: city }));
  }, [editDraft?.city]);

  const staffBranchOptions = useMemo(
    () => [
      {
        value: parsedBranchId.toString(),
        label: selectedBranch?.name || 'Current Branch',
      },
    ],
    [parsedBranchId, selectedBranch?.name]
  );

  const tabBadges = useMemo(
    () => ({
      staff: staffMembers.length,
      activity: activityLogs.length,
      transactions: transactions.length,
      inventory: inventoryItems.length,
    }),
    [activityLogs.length, inventoryItems.length, staffMembers.length, transactions.length]
  );

  const kpis = useMemo(
    () =>
      selectedBranch ? getKpisForTab(activeTab, {
        branch: selectedBranch,
        employees: staffMembers,
        activityLogs,
        transactions,
        inventoryItems,
      }) : [],
    [activeTab, activityLogs, inventoryItems, selectedBranch, staffMembers, transactions]
  );

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">Loading branch profile...</Typography>
      </Box>
    );
  }

  if (!selectedBranch || !formData) {
    return (
      <Box sx={{ pb: 4, display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 4,
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Branch not found
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 3 }}>
            The requested branch profile could not be loaded.
          </Typography>
          <Button onClick={() => navigate({ to: '/branches' })}>Back to Branches</Button>
        </Paper>
      </Box>
    );
  }

  const updateEditDraft = <K extends keyof BranchFormData>(field: K, value: BranchFormData[K]) => {
    setEditDraft((previous) => {
      if (!previous) {
        return previous;
      }

      return { ...previous, [field]: value };
    });
  };

  const handleSave = () => {
    if (!editDraft) {
      return;
    }

    console.log('Saving branch profile:', {
      branchId: selectedBranch.id,
      ...editDraft,
    });

    setFormData(editDraft);
    setIsEditModalOpen(false);
    setShowSavedNotice(true);
  };

  const handleCloseEditModal = () => {
    setEditDraft(formData);
    setIsEditModalOpen(false);
  };

  const handleOpenEditModal = () => {
    setEditDraft(formData);
    setIsEditModalOpen(true);
    setActiveTab('details');
  };

  const handleCreateStaff = () => {
    loadData(); // Refresh staff list
    setIsAddStaffModalOpen(false);
    setActiveTab('staff');
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate({ to: '/branches' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 10,
              border: '1px solid #D6D3D1',
              background: '#FFFFFF',
              color: '#57534E',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 14 }} />
            Branches
          </button>

          <ChevronRightRoundedIcon sx={{ fontSize: 15, color: '#A8A29E' }} />

          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary' }}>{formData.name}</Typography>

          <Chip
            label={branchCode}
            size="small"
            sx={{
              height: 22,
              borderRadius: 999,
              bgcolor: 'rgba(201,168,76,0.2)',
              color: '#5C4518',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </Box>
      </Box>

      <BranchProfileHero
        branch={selectedBranch}
        formData={formData}
        branchCode={branchCode}
        branchOpen={branchOpen}
        kpis={kpis}
        showSavedNotice={showSavedNotice}
        onViewInventory={() => setActiveTab('inventory')}
        onEnableEdit={handleOpenEditModal}
      />

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
        <BranchProfileTabHeader
          tabs={BRANCH_PROFILE_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          badgeMap={tabBadges}
        />

        {activeTab === 'details' ? (
          <BranchDetailsTab
            formData={formData}
            statusOptions={STATUS_OPTIONS}
            ownerOptions={OWNER_OPTIONS}
            managerOptions={MANAGER_OPTIONS}
          />
        ) : null}

        {activeTab === 'staff' ? (
          <BranchStaffTab
            employees={staffMembers}
            onAddStaff={() => setIsAddStaffModalOpen(true)}
            onOpenStaffProfile={(employee) =>
              navigate({
                to: '/staff/$staffId',
                params: { staffId: employee.id.toString() },
              })
            }
          />
        ) : null}

        {activeTab === 'activity' ? <BranchActivityTab logs={activityLogs} /> : null}

        {activeTab === 'transactions' ? <BranchTransactionsTab transactions={transactions} /> : null}

        {activeTab === 'inventory' ? <BranchInventoryTab items={inventoryItems} /> : null}
      </Paper>

      <BranchEditModal
        open={isEditModalOpen}
        formData={editDraft}
        statusOptions={STATUS_OPTIONS}
        cityOptions={cityOptions}
        ownerOptions={OWNER_OPTIONS}
        managerOptions={MANAGER_OPTIONS}
        onClose={handleCloseEditModal}
        onSave={handleSave}
        onUpdate={updateEditDraft}
      />

      <AddStaffModal
        open={isAddStaffModalOpen}
        branchOptions={staffBranchOptions}
        initialBranchId={selectedBranch.id.toString()}
        initialBranchName={selectedBranch.name}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSave={handleCreateStaff}
      />
    </Box>
  );
}
