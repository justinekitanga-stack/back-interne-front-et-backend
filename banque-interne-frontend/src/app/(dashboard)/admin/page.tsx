// src/app/(dashboard)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { 
  Users, ArrowRightLeft, DollarSign, UserCog, 
  TrendingUp, TrendingDown, AlertCircle 
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface StatsData {
  total_clients: number;
  total_employees: number;
  transactions_today: number;
  total_depots: string;
  total_retraits: string;
  comptes_actifs: number;
  comptes_inactifs: number;
  comptes_bloques: number;
}

interface RecentTransaction {
  reference: string;
  type_transaction_display: string;
  montant: string;
  nom_client: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les stats
      const [clientsRes, transactionsRes, employeesRes] = await Promise.all([
        api.get('/clients/list/?limit=1'),
        api.get('/transactions/list/?limit=5'),
        api.get('/auth/employees/'),
      ]);

      // Calculer les stats
      const totalClients = clientsRes.data.total || 0;
      const transactions = transactionsRes.data.data || [];
      const employees = employeesRes.data.data || [];

      // Stats calculées
      setStats({
        total_clients: totalClients,
        total_employees: employees.length,
        transactions_today: transactions.filter((t: any) => {
          const today = new Date().toDateString();
          return new Date(t.created_at).toDateString() === today;
        }).length,
        total_depots: transactionsRes.data.stats?.total_depots || '0',
        total_retraits: transactionsRes.data.stats?.total_retraits || '0',
        comptes_actifs: 0,
        comptes_inactifs: 0,
        comptes_bloques: 0,
      });

      setRecentTransactions(transactions.slice(0, 5));
      
    } catch (error) {
      console.error('Erreur dashboard:', error);
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
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
    },
    {
      title: 'Employés',
      value: stats?.total_employees || 0,
      icon: UserCog,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Dépôts',
      value: `${stats?.total_depots || 0} USD`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Retraits',
      value: `${stats?.total_retraits || 0} USD`,
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de la banque</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Deuxième rangée : Infos comptes et Transactions récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* État des comptes */}
        <Card title="État des comptes">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Comptes actifs</span>
              <span className="font-semibold text-green-600">{stats?.comptes_actifs || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Comptes inactifs</span>
              <span className="font-semibold text-yellow-600">{stats?.comptes_inactifs || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Comptes bloqués</span>
              <span className="font-semibold text-red-600">{stats?.comptes_bloques || 0}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transactions aujourd'hui</span>
                <span className="font-semibold text-blue-600">{stats?.transactions_today || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Transactions récentes */}
        <Card title="Transactions récentes">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune transaction récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTransactionColor(transaction.type_transaction_display)}`}>
                        {transaction.type_transaction_display}
                      </span>
                      <span className="text-sm text-gray-500">• {transaction.nom_client}</span>
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
                  <span className={`font-semibold ${
                    transaction.type_transaction_display === 'Dépôt' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type_transaction_display === 'Dépôt' ? '+' : '-'}
                    {transaction.montant} USD
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Actions rapides */}
      <Card title="Actions rapides">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Nouveau client</p>
            <p className="text-sm text-gray-500">Créer un compte</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Dépôt</p>
            <p className="text-sm text-gray-500">Effectuer un dépôt</p>
          </button>
          <button className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left">
            <TrendingDown className="h-6 w-6 text-red-600 mb-2" />
            <p className="font-medium text-gray-900">Retrait</p>
            <p className="text-sm text-gray-500">Effectuer un retrait</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <UserCog className="h-6 w-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Employé</p>
            <p className="text-sm text-gray-500">Ajouter un employé</p>
          </button>
        </div>
      </Card>
    </div>
  );
}