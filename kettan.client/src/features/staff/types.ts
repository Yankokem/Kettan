export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  status: 'active' | 'inactive' | 'archived';
  avatar: string;
  imageUrl?: string | null;
}
