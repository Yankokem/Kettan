export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  status: 'active' | 'inactive';
  avatar: string;
}
