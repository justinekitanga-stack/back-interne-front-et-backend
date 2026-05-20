// src/app/(dashboard)/agent/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Users, ArrowRightLeft, TrendingUp, TrendingDown, 
  UserPlus, DollarSign, AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface StatsData {
  total_clients: number;
  transactions_today: number;
  total_depots: string;
  total_retraits: string;
  comptes_actifs: number;
  comptes_inactifs: number;
}

interface RecentTransaction {
  reference: string;
  type_transaction_display: string;
  montant: string;
  nom_client: string;
  numero_compte: string;
  created_at: string;
}

export default function AgentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchUnreadCount();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données en parallèle
      const [clientsRes, transactionsRes, soldeRes] = await Promise.all([
        api.get('/clients/list/?limit=1'),
        api.get('/transactions/list/?limit=5&page=1'),
        api.get('/transactions/list/?limit=1'), // Pour avoir les stats
      ]);

      const totalClients = clientsRes.data.total || 0;
      const allTransactions = transactionsRes.data.data || [];
      const stats = transactionsRes.data.stats || {};

      // Filtrer les transactions du jour
      const today = new Date().toDateString();
      const todayTransactions = allTransactions.filter((t: any) => {
        return new Date(t.created_at).toDateString() === today;
      });

      setStats({
        total_clients: totalClients,
        transactions_today: todayTransactions.length,
        total_depots: stats.total_depots || '0',
        total_retraits: stats.total_retraits || '0',
        comptes_actifs: 0,
        comptes_inactifs: 0,
      });

      setRecentTransactions(allTransactions.slice(0, 5));
      
    } catch (error) {
      console.error('Erreur dashboard:', error);
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count/');
      setUnreadNotifications(response.data.data.unread_count);
    } catch (error) {
      // Silencieux
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const mainStats = [
    {
      title: 'Total Clients',
      value: stats?.total_clients || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      route: '/agent/clients',
    },
    {
      title: 'Dépôts',
      value: `${stats?.total_depots || 0} USD`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      route: '/agent/transactions/depot',
    },
    {
      title: 'Retraits',
      value: `${stats?.total_retraits || 0} USD`,
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      route: '/agent/transactions/retrait',
    },
    {
      title: "Aujourd'hui",
      value: `${stats?.transactions_today || 0} transactions`,
      icon: ArrowRightLeft,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      route: '/agent/transactions',
    },
  ];

  const getTransactionColor = (type: string) => {
    return type === 'Dépôt' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Agent</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions rapides */}
        <Card title="Actions rapides">
          <div className="space-y-3">
            <Button 
              className="w-full" 
              variant="primary"
              onClick={() => router.push('/agent/clients/create')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
            <Button 
              className="w-full" 
              variant="success"
              onClick={() => router.push('/agent/transactions/depot')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Dépôt
            </Button>
            <Button 
              className="w-full" 
              variant="danger"
              onClick={() => router.push('/agent/transactions/retrait')}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Retrait
            </Button>
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={() => router.push('/agent/transactions/transfert')}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfert
            </Button>
          </div>
        </Card>

        {/* Transactions récentes */}
        <Card 
          title="Transactions récentes"
          action={
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push('/agent/transactions')}
            >
              Voir tout
            </Button>
          }
          className="lg:col-span-2"
        >
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune transaction récente</p>
              <Button 
                variant="primary" 
                size="sm" 
                className="mt-4"
                onClick={() => router.push('/agent/transactions/depot')}
              >
                Effectuer une transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type_transaction_display === 'Dépôt' 
                        ? 'bg-green-100' 
                        : transaction.type_transaction_display === 'Retrait'
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                    }`}>
                      {transaction.type_transaction_display === 'Dépôt' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : transaction.type_transaction_display === 'Retrait' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTransactionColor(transaction.type_transaction_display)}`}>
                          {transaction.type_transaction_display}
                        </span>
                        <span className="text-sm text-gray-600">{transaction.nom_client}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type_transaction_display === 'Dépôt' 
                      ? 'text-green-600' 
                      : transaction.type_transaction_display === 'Retrait'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                    {transaction.type_transaction_display === 'Dépôt' ? '+' : 
                     transaction.type_transaction_display === 'Retrait' ? '-' : ''}
                    {Number(transaction.montant).toLocaleString()} USD
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Notifications rapides */}
      {unreadNotifications > 0 && (
        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  {unreadNotifications} notification(s) non lue(s)
                </p>
                <p className="text-sm text-blue-700">
                  Vous avez des notifications en attente
                </p>
              </div>
            </div>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => router.push('/agent/notifications')}
            >
              Voir
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// Ajouter l'icône Bell dans les imports
import { Bell } from 'lucide-react';