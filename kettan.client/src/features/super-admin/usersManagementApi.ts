import { api } from '../../utils/api';

export interface PlatformUserRow {
  userId: number;
  tenantName: string;
  branchName: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export async function fetchPlatformUsers(): Promise<PlatformUserRow[]> {
  try {
    const res = await api.get('/api/admin/users');
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to load platform users');
  }
}

export async function updateUserStatus(userId: number, isActive: boolean): Promise<void> {
  try {
    await api.patch(`/api/admin/users/${userId}/status`, isActive, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update user status');
  }
}

export async function archiveUser(userId: number): Promise<void> {
  try {
    await api.delete(`/api/admin/users/${userId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to archive user');
  }
}
