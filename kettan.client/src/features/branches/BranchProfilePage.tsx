import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/UI/PageHeader';
import { Button } from '../../components/UI/Button';
import {
  BRANCHES_MOCK,
} from './mockData';
import { api } from '../../utils/api';
import {
  BRANCH_PROFILE_TABS,
  getKpisForTab,
  mapActivityLog,
  mapBranch,
  mapEmployee,
  mapInventoryItem,
  mapSupplyRequestToTransaction,
  mapOrderToTransaction,
  mapReturnToTransaction,
  toBranchFormData,
} from './branchProfileData';
import {
  fetchBranch,
  fetchBranchActivity,
  fetchBranchInventory,
  fetchBranchStaff,
  fetchBranchTransactions,
  updateBranch,
  type UpdateBranchDto,
} from './branchesApi';
import { BranchProfileHero } from './components/profile/BranchProfileHero';
import { BranchProfileTabHeader } from './components/profile/BranchProfileTabHeader';
import { BranchDetailsTab } from './components/profile/BranchDetailsTab';
import { BranchStaffTab } from './components/profile/BranchStaffTab';
import { BranchActivityTab } from './components/profile/BranchActivityTab';
import { BranchTransactionsTab } from './components/profile/BranchTransactionsTab';
import { BranchInventoryTab } from './components/profile/BranchInventoryTab';
import { BranchEditModal } from './components/profile/BranchEditModal.tsx';
import type {
  Branch,
  BranchActivityLog,
  BranchEmployee,
  BranchFormData,
  BranchInventoryItem,
  BranchProfileTabKey,
  BranchTransactionRow,
} from './types';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Operational)' },
  { value: 'setup', label: 'Setup Pending' },
];


export function BranchProfilePage() {
  const navigate = useNavigate();
  const { branchId } = useParams({ from: '/layout/branches/$branchId' });

  const parsedBranchId = Number(branchId);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [staffMembers, setStaffMembers] = useState<BranchEmployee[]>([]);
  const [activityLogs, setActivityLogs] = useState<BranchActivityLog[]>([]);
  const [transactions, setTransactions] = useState<BranchTransactionRow[]>([]);
  const [inventoryItems, setInventoryItems] = useState<BranchInventoryItem[]>([]);
  const [users, setUsers] = useState<Array<{ userId: number; firstName: string; lastName: string; role: string }>>([]);
  
  const [branchLoading, setBranchLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<BranchProfileTabKey>('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSavedNotice, setShowSavedNotice] = useState(false);
  
  const [formData, setFormData] = useState<BranchFormData | null>(null);
  const [editDraft, setEditDraft] = useState<BranchFormData | null>(null);

  // Phase 1: Load Branch Info (Hero & Base Meta)
  const loadBranchInfo = useCallback(async () => {
    setBranchLoading(true);
    try {
      const branchDto = await fetchBranch(parsedBranchId);
      const branch = mapBranch(branchDto);
      setSelectedBranch(branch);
      
      const initialFormData = toBranchFormData(branch);
      setFormData(initialFormData);
      setEditDraft(initialFormData);
    } catch (error) {
      console.error('Failed to load branch info:', error);
    } finally {
      setBranchLoading(false);
    }
  }, [parsedBranchId]);

  // Phase 1.5: Load Users for assignments
  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  // Phase 2: Lazy Load Tab Content
  const loadTabContent = useCallback(async (tab: BranchProfileTabKey) => {
    // Only load if we haven't already or if we want to refresh
    setTabLoading(true);
    try {
      switch (tab) {
        case 'staff':
        case 'details': // Details needs staff for KPIs
          const staffDto = await fetchBranchStaff(parsedBranchId);
          setStaffMembers(staffDto.map(mapEmployee));
          break;
        case 'activity':
          const activityDto = await fetchBranchActivity(parsedBranchId);
          setActivityLogs(activityDto.map(mapActivityLog));
          break;
        case 'transactions':
          const transData = await fetchBranchTransactions(parsedBranchId);
          const allTransactions: BranchTransactionRow[] = [
            ...transData.supplyRequests.map(mapSupplyRequestToTransaction),
            ...transData.orders.map(mapOrderToTransaction),
            ...transData.returns.map(mapReturnToTransaction),
          ];
          // Sort by date, newest first
          allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setTransactions(allTransactions);
          break;
        case 'inventory':
          const invDto = await fetchBranchInventory(parsedBranchId);
          setInventoryItems(invDto.map(mapInventoryItem));
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${tab} content:`, error);
    } finally {
      setTabLoading(false);
    }
  }, [parsedBranchId]);

  useEffect(() => {
    loadBranchInfo();
    loadUsers();
  }, [loadBranchInfo, loadUsers]);

  useEffect(() => {
    // Load content for active tab whenever it changes
    loadTabContent(activeTab);
  }, [activeTab, loadTabContent]);

  useEffect(() => {
    if (!showSavedNotice) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setShowSavedNotice(false);
    }, 2200);

    return () => clearTimeout(timeoutHandle);
  }, [showSavedNotice]);

  const ownerOptions = useMemo(() => [
    { value: '', label: 'Unassigned (Optional)' },
    ...users
      .filter((u) => u.role === 'BranchOwner')
      .map((u) => ({ value: String(u.userId), label: `${u.firstName} ${u.lastName}` })),
  ], [users]);

  const managerOptions = useMemo(() => [
    { value: '', label: 'Select a manager...' },
    ...users
      .filter((u) => u.role === 'BranchManager')
      .map((u) => ({ value: String(u.userId), label: `${u.firstName} ${u.lastName}` })),
  ], [users]);

  const cityOptions = useMemo(() => {
    const knownCities = Array.from(new Set(BRANCHES_MOCK.map((branch) => branch.city).filter(Boolean)));
    if (editDraft?.city && !knownCities.includes(editDraft.city)) {
      knownCities.push(editDraft.city);
    }

    return knownCities.map((city) => ({ value: city, label: city }));
  }, [editDraft?.city]);

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

  // if (branchLoading) removed to prevent jarring "Connecting" text


  if (!branchLoading && (!selectedBranch || !formData)) {
    return (
      <Box sx={{ pb: 4, display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
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

  const handleSave = async () => {
    if (!editDraft || !selectedBranch) {
      return;
    }

    try {
      const updateDto: UpdateBranchDto = {
        name: editDraft.name.trim(),
        location: [editDraft.address.trim(), editDraft.city.trim()].filter(Boolean).join(', '),
        address: editDraft.address.trim(),
        city: editDraft.city.trim(),
        contactNumber: editDraft.contactNumber.trim(),
        openTime: editDraft.openTime,
        closeTime: editDraft.closeTime,
        ownerUserId: editDraft.ownerUserId,
        managerUserId: editDraft.managerUserId,
        isActive: editDraft.status === 'active',
        imageUrl: editDraft.imageUrl,
      };

      await updateBranch(selectedBranch.id, updateDto);
      
      setFormData(editDraft);
      setIsEditModalOpen(false);
      setShowSavedNotice(true);
      
      // Reload to get fresh data from server
      void loadBranchInfo();
    } catch (error) {
      console.error('Failed to save branch profile:', error);
      alert('Failed to save changes. Please try again.');
    }
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


  return (
    <Box sx={{ pb: 5 }}>
      <PageHeader
        title={formData?.name || 'Loading Branch...'}
        description="Manage branch operations, network details, and network growth."
        backTo="/branches"
      />

      <BranchProfileHero
        branch={selectedBranch}
        formData={formData}
        kpis={kpis}
        showSavedNotice={showSavedNotice}
        onEnableEdit={handleOpenEditModal}
        loading={branchLoading}
      />

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}>
        <BranchProfileTabHeader
          tabs={BRANCH_PROFILE_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          loading={tabLoading}
        />

        {activeTab === 'details' && (formData || tabLoading) ? (
          <BranchDetailsTab
            formData={formData}
            statusOptions={STATUS_OPTIONS}
            ownerOptions={ownerOptions}
            managerOptions={managerOptions}
            loading={tabLoading}
          />
        ) : null}

        {activeTab === 'staff' ? (
          <BranchStaffTab
            employees={staffMembers}
            loading={tabLoading}
            onOpenStaffProfile={(employee) =>
              navigate({
                to: '/staff/$staffId',
                params: { staffId: employee.id.toString() },
              })
            }
          />
        ) : null}

        {activeTab === 'activity' ? <BranchActivityTab logs={activityLogs} loading={tabLoading} /> : null}

        {activeTab === 'transactions' ? <BranchTransactionsTab transactions={transactions} loading={tabLoading} /> : null}

        {activeTab === 'inventory' ? <BranchInventoryTab items={inventoryItems} loading={tabLoading} /> : null}

      </Paper>

      <BranchEditModal
        open={isEditModalOpen}
        formData={editDraft}
        statusOptions={STATUS_OPTIONS}
        cityOptions={cityOptions}
        ownerOptions={ownerOptions}
        managerOptions={managerOptions}
        onClose={handleCloseEditModal}
        onSave={handleSave}
        onUpdate={updateEditDraft}
      />


    </Box>
  );
}
