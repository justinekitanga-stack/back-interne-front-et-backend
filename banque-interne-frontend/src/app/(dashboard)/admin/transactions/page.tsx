// src/app/(dashboard)/admin/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Search, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import api from '@/lib/api';
import { Transaction } from '@/types/transaction';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<any>(null);
  
  // Filtres
  const [filterType, setFilterType] = useState('');
  const [searchCompte, setSearchCompte] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const totalPages = Math.ceil(total / 20);

  useEffect(() => {
    fetchTransactions();
  }, [page, filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (filterType) params.type = filterType;
      if (searchCompte) params.compte = searchCompte;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;

      const response = await api.get('/transactions/list/', { params });
      setTransactions(response.data.data || []);
      setTotal(response.data.total || 0);
      setStats(response.data.stats || null);
    } catch (error) {
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">Historique des opérations</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Dépôts</p>
                <p className="font-bold text-gray-900">{stats.total_depots} USD</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Retraits</p>
                <p className="font-bold text-gray-900">{stats.total_retraits} USD</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nb Dépôts</p>
                <p className="font-bold text-gray-900">{stats.nombre_depots}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nb Retraits</p>
                <p className="font-bold text-gray-900">{stats.nombre_retraits}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tous</option>
              <option value="DEPOT">Dépôts</option>
              <option value="RETRAIT">Retraits</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° Compte</label>
            <input
              type="text"
              value={searchCompte}
              onChange={(e) => setSearchCompte(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Référence</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Compte</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employé</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx) => (
                  <tr key={trx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">{trx.reference}</span>
                    </td>
                    <td className="py-3 px-4">
                      {trx.type_transaction === 'DEPOT' ? (
                        <Badge variant="success">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Dépôt
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Retrait
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">{trx.nom_client}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">{trx.numero_compte}</span>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      trx.type_transaction === 'DEPOT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trx.type_transaction === 'DEPOT' ? '+' : '-'}{Number(trx.montant).toLocaleString()} USD
                    </td>
                    <td className="py-3 px-4 text-sm">{trx.effectue_par_nom}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDateTime(trx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}