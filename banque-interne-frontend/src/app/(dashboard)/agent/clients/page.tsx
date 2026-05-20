// src/app/(dashboard)/agent/clients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Search, UserPlus, Eye, CheckCircle, Ban } from 'lucide-react';
import api from '@/lib/api';
import { Client } from '@/types/client';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('TOUS');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / 20);

  useEffect(() => {
    fetchClients();
  }, [page, filter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (filter !== 'TOUS') params.statut = filter;
      
      const response = await api.get('/clients/list/', { params });
      setClients(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
    client.numero_compte.includes(search) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIF': return <Badge variant="success">Actif</Badge>;
      case 'INACTIF': return <Badge variant="warning">Inactif</Badge>;
      case 'BLOQUE': return <Badge variant="danger">Bloqué</Badge>;
      case 'CLOTURE': return <Badge variant="default">Clôturé</Badge>;
      default: return <Badge variant="default">{statut}</Badge>;
    }
  };

  const getTypeCompteBadge = (type: string) => {
    switch (type) {
      case 'EPARGNE': return <Badge variant="info">Épargne</Badge>;
      case 'COURANT': return <Badge variant="success">Courant</Badge>;
      case 'SALAIRE': return <Badge variant="default">Salaire</Badge>;
      default: return <Badge variant="default">{type}</Badge>;
    }
  };

  const handleActivate = async (numeroCompte: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post('/clients/activer/', { numero_compte: numeroCompte });
      toast.success('Compte activé avec succès');
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'activation');
    }
  };


  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{total} client(s) au total</p>
        </div>
        <Button onClick={() => router.push('/agent/clients/create')}>
          <UserPlus className="h-5 w-5 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, numéro de compte ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="INACTIF">Inactifs</option>
          <option value="BLOQUE">Bloqués</option>
          <option value="CLOTURE">Clôturés</option>
        </select>
      </div>

      {/* Tableau des clients */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">N° Compte</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Solde</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr 
                    key={client.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/agent/clients/${client.numero_compte}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium">{client.numero_compte}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{client.nom_complet}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{client.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{client.telephone}</td>
                    <td className="py-3 px-4">{getTypeCompteBadge(client.type_compte)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">
                        {Number(client.solde).toLocaleString()} USD
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(client.statut)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {client.statut === 'INACTIF' && (
                          <button
                            onClick={(e) => handleActivate(client.numero_compte, e)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Activer le compte"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/agent/clients/${client.numero_compte}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
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