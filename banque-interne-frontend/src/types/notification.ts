// src/types/notification.ts
export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  type_display: string;
  is_read: boolean;
  temps_ecoule: string;
  created_at: string;
}