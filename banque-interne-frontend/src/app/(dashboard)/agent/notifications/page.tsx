// src/app/(dashboard)/agent/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { 
  Bell, BellOff, CheckCheck, Trash2, 
  Info, AlertCircle, AlertTriangle, CheckCircle 
} from 'lucide-react';
import api from '@/lib/api';
import { Notification } from '@/types/notification';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('TOUTES');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'NON_LUES') params.unread = 'true';
      if (filter !== 'TOUTES' && filter !== 'NON_LUES') params.type = filter;

      const response = await api.get('/notifications/list/', { params });
      setNotifications(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count/');
      setUnreadCount(response.data.data.unread_count);
    } catch (error) {
      // Silencieux
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (id: number) => {
    try {
      await api.post('/notifications/mark-read/', {
        notification_ids: [id]
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Marquer tout comme lu
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-read/', {
        mark_all: true
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Toutes les notifications sont marquées comme lues');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Marquer la sélection comme lue
  const markSelectedAsRead = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await api.post('/notifications/mark-read/', {
        notification_ids: selectedIds
      });
      
      setNotifications(prev => 
        prev.map(n => selectedIds.includes(n.id) ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - selectedIds.length));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} notification(s) marquée(s) comme lue(s)`);
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/delete/${id}/`);
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!notifications.find(n => n.id === id)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Supprimer tout
  const deleteAll = async () => {
    if (!confirm('Supprimer toutes les notifications ?')) return;
    
    try {
      await api.delete('/notifications/delete-all/');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Toutes les notifications sont supprimées');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Toggle sélection
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // Obtenir l'icône selon le type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ERROR': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'INFO':
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'border-l-green-500 bg-green-50';
      case 'ERROR': return 'border-l-red-500 bg-red-50';
      case 'WARNING': return 'border-l-yellow-500 bg-yellow-50';
      case 'INFO':
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 
              ? `${unreadCount} notification(s) non lue(s)` 
              : 'Tout est lu'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            onClick={deleteAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tout supprimer
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['TOUTES', 'NON_LUES', 'SUCCESS', 'ERROR', 'WARNING', 'INFO'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {f === 'TOUTES' && 'Toutes'}
            {f === 'NON_LUES' && 'Non lues'}
            {f === 'SUCCESS' && 'Succès'}
            {f === 'ERROR' && 'Erreurs'}
            {f === 'WARNING' && 'Avertissements'}
            {f === 'INFO' && 'Infos'}
          </button>
        ))}
      </div>

      {/* Actions sélection */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-blue-700">
            {selectedIds.length} notification(s) sélectionnée(s)
          </p>
          <Button size="sm" onClick={markSelectedAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marquer comme lues
          </Button>
        </div>
      )}

      {/* Liste des notifications */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-500">
              {filter === 'NON_LUES' 
                ? 'Vous avez lu toutes vos notifications' 
                : 'Pas de notifications pour le moment'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative flex gap-4 p-4 border-l-4 transition-colors ${
                  notification.is_read 
                    ? 'border-l-transparent hover:bg-gray-50' 
                    : getNotificationColor(notification.notification_type)
                }`}
              >
                {/* Checkbox */}
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Icône */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.notification_type)}
                </div>

                {/* Contenu */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm ${notification.is_read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-2">
                    {notification.temps_ecoule}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}