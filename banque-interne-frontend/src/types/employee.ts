// src/types/employee.ts
export interface Employee {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  phone: string;
  role: 'ADMIN' | 'AGENT';
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}