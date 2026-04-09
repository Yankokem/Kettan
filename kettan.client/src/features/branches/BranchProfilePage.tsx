import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import {
  BRANCH_MANAGER_OPTIONS,
  BRANCH_OWNER_OPTIONS,
  BRANCHES_MOCK,
  getBranchActivityById,
  getBranchById,
  getBranchEmployeesById,
  getBranchInventoryById,
  getBranchTransactionsById,
} from './mockData';
import {
  BRANCH_PROFILE_TABS,
  getKpisForTab,
  isOpenNow,
  toBranchFormData,
} from './branchProfileData';
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
  const selectedBranch = useMemo(() => getBranchById(parsedBranchId), [parsedBranchId]);
  const branchEmployees = useMemo(() => getBranchEmployeesById(parsedBranchId), [parsedBranchId]);
  const activityLogs = useMemo(() => getBranchActivityById(parsedBranchId), [parsedBranchId]);
  const transactions = useMemo(() => getBranchTransactionsById(parsedBranchId), [parsedBranchId]);
  const inventoryItems = useMemo(() => getBranchInventoryById(parsedBranchId), [parsedBranchId]);

  const [activeTab, setActiveTab] = useState<BranchProfileTabKey>('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [showSavedNotice, setShowSavedNotice] = useState(false);
  const [formData, setFormData] = useState<BranchFormData | null>(
    selectedBranch ? toBranchFormData(selectedBranch) : null
  );
  const [editDraft, setEditDraft] = useState<BranchFormData | null>(
    selectedBranch ? toBranchFormData(selectedBranch) : null
  );
  const [staffMembers, setStaffMembers] = useState<BranchEmployee[]>(branchEmployees);

  useEffect(() => {
    const nextFormData = selectedBranch ? toBranchFormData(selectedBranch) : null;

    setFormData(nextFormData);
    setEditDraft(nextFormData);
    setStaffMembers(branchEmployees);
    setActiveTab('details');
    setIsEditModalOpen(false);
    setIsAddStaffModalOpen(false);
    setShowSavedNotice(false);
  }, [branchEmployees, selectedBranch]);

  useEffect(() => {
    if (!showSavedNotice) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setShowSavedNotice(false);
    }, 2200);

    return () => clearTimeout(timeoutHandle);
  }, [showSavedNotice]);

  if (!selectedBranch || !formData) {
    return (
      <Box sx={{ pb: 4, pt: 1, display: 'flex', justifyContent: 'center' }}>
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

  const branchCode = `BR-${selectedBranch.id.toString().padStart(5, '0')}`;
  const branchOpen = isOpenNow(formData.openTime, formData.closeTime);

  const cityOptions = useMemo(() => {
    const knownCities = Array.from(new Set(BRANCHES_MOCK.map((branch) => branch.city).filter(Boolean)));
    if (editDraft?.city && !knownCities.includes(editDraft.city)) {
      knownCities.push(editDraft.city);
    }

    return knownCities.map((city) => ({ value: city, label: city }));
  }, [editDraft?.city]);

  const staffBranchOptions = useMemo(
    () =>
      BRANCHES_MOCK.map((branch) => ({
        value: branch.id.toString(),
        label: branch.name,
      })),
    []
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
      getKpisForTab(activeTab, {
        branch: selectedBranch,
        employees: staffMembers,
        activityLogs,
        transactions,
        inventoryItems,
      }),
    [activeTab, activityLogs, inventoryItems, selectedBranch, staffMembers, transactions]
  );

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

  const handleCreateStaff = (formValues: AddStaffFormValues) => {
    if (!formValues.role) {
      return;
    }

    const assignedBranchId = Number(formValues.branchAssignment);
    const nextId = staffMembers.reduce((maxId, employee) => Math.max(maxId, employee.id), 0) + 1;

    const newEmployee: BranchEmployee = {
      id: nextId,
      branchId: Number.isFinite(assignedBranchId) ? assignedBranchId : null,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      position: STAFF_ROLE_TO_POSITION[formValues.role],
      contactNumber: 'N/A',
      dateHired: new Date().toISOString(),
      isActive: true,
    };

    if (newEmployee.branchId === selectedBranch.id) {
      setStaffMembers((previous) => [newEmployee, ...previous]);
    }

    setIsAddStaffModalOpen(false);
    setActiveTab('staff');
  };

  return (
    <Box sx={{ pb: 5, pt: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{ marginBottom: 16 }}
      >
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
            <ArrowLeft size={13} />
            Branches
          </button>

          <ChevronRight size={13} color="#A8A29E" />

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
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
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
      </motion.div>

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
