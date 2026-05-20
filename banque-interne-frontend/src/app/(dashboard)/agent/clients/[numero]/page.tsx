// src/app/(dashboard)/agent/clients/[numero]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { 
  ArrowLeft, Mail, Phone, Calendar,
  DollarSign, User, Camera, FileText,
  CheckCircle, Ban, TrendingUp, TrendingDown
} from 'lucide-react';
import api from '@/lib/api';
import { getMediaUrl, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Client } from '@/types/client';
import toast from 'react-hot-toast';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.numero) {
      fetchClient();
    }
  }, [params.numero]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients/detail/${params.numero}/`);
      setClient(response.data.data);
    } catch (error) {
      toast.error('Client non trouvé');
      router.push('/agent/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      await api.post('/clients/activer/', { 
        numero_compte: params.numero 
      });
      toast.success('Compte activé avec succès');
      fetchClient();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };


  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIF': return <Badge variant="success">Actif</Badge>;
      case 'INACTIF': return <Badge variant="warning">Inactif</Badge>;
      case 'BLOQUE': return <Badge variant="danger">Bloqué</Badge>;
      case 'CLOTURE': return <Badge variant="default">Clôturé</Badge>;
      default: return <Badge variant="default">{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.nom_complet}</h1>
            <p className="text-gray-500">{client.numero_compte}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {client.statut === 'INACTIF' && (
            <Button variant="success" onClick={handleActivate}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Activer
            </Button>
          )}
          
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Infos compte */}
        <div className="space-y-6">
          {/* Solde */}
          <Card>
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(client.solde)}
              </p>
              <p className="text-sm text-gray-500">Solde actuel</p>
            </div>
          </Card>

          {/* Infos compte */}
          <Card title="Compte">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Numéro de compte</p>
                <p className="font-mono font-medium">{client.numero_compte}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type de compte</p>
                <Badge variant="info">{client.type_compte}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                {getStatusBadge(client.statut)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Devise</p>
                <p className="font-medium">USD - Dollar Américain</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Créé par</p>
                <p className="font-medium">{client.created_by_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium">{formatDateTime(client.created_at)}</p>
              </div>
            </div>
          </Card>

          {/* Actions rapides */}
          <Card title="Actions">
            <div className="space-y-2">
              <Button 
                className="w-full" 
                variant="primary"
                onClick={() => router.push(`/agent/transactions/depot?compte=${client.numero_compte}`)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Dépôt
              </Button>
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => router.push(`/agent/transactions/retrait?compte=${client.numero_compte}`)}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Retrait
              </Button>
            </div>
          </Card>
        </div>

        {/* Colonne droite - Détails */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos personnelles */}
          <Card title="Informations personnelles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-medium">{client.nom_complet}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">{client.telephone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Date de naissance</p>
                  <p className="font-medium">
                    {formatDate(client.birthday)} ({client.age} ans)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Genre</p>
                  <p className="font-medium">{client.genre === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card title="Documents">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Carte d'identité</p>
                <div className="border rounded-lg overflow-hidden bg-gray-100">
                  {client.carte_identite ? (
                    <img 
                      src={getMediaUrl(client.carte_identite)} 
                      alt="Carte d'identité" 
                      className="w-full h-64 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      }}
                    />
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Non disponible</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Photo passeport</p>
                <div className="border rounded-lg overflow-hidden bg-gray-100">
                  {client.photo_passeport ? (
                    <img 
                      src={getMediaUrl(client.photo_passeport)} 
                      alt="Photo passeport" 
                      className="w-full h-64 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      }}
                    />
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Non disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}