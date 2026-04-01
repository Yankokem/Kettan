export interface Branch {
  id: number;
  name: string;
  location: string;
  manager: string;
  staff: number;
  status: 'active' | 'setup';
}
