// src/app/(dashboard)/admin/employees/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { 
  ArrowLeft, Mail, Phone, Shield, Clock, 
  UserCog, Calendar
} from 'lucide-react';
import api from '@/lib/api';
import { Employee } from '@/types/employee';
import toast from 'react-hot-toast';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEmployee();
    }
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/employees/${params.id}/`);
      setEmployee(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des informations');
      router.push('/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (newStatus: string) => {
    try {
      setStatusLoading(true);
      await api.post(`/auth/employees/${params.id}/status/`, {
        statut: newStatus
      });
      toast.success(`Statut changé à ${newStatus}`);
      fetchEmployee();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de statut');
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIF': return <Badge variant="success">Actif</Badge>;
      case 'INACTIF': return <Badge variant="warning">Inactif</Badge>;
      case 'SUSPENDU': return <Badge variant="danger">Suspendu</Badge>;
      default: return <Badge variant="default">{statut}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge variant="info">Administrateur</Badge>;
      case 'AGENT': return <Badge variant="default">Agent</Badge>;
      default: return <Badge variant="default">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <UserCog className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Employé non trouvé</h2>
        <p className="text-gray-500 mb-4">Cet employé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => router.push('/admin/employees')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détail employé</h1>
            <p className="text-gray-500 mt-1">{employee.employee_id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte profil */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            {/* Avatar */}
            <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-white">
                {employee.first_name?.[0]}{employee.last_name?.[0] || employee.username[0]}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-gray-500">@{employee.username}</p>

            <div className="flex justify-center gap-2 mt-3">
              {getRoleBadge(employee.role)}
              {getStatusBadge(employee.statut)}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="h-5 w-5" />
              <span>{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-5 w-5" />
                <span>{employee.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-600">
              <Shield className="h-5 w-5" />
              <span>{employee.employee_id}</span>
            </div>
          </div>

          {/* Actions sur le statut */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Changer le statut</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={employee.statut === 'ACTIF' ? 'success' : 'secondary'}
                onClick={() => changeStatus('ACTIF')}
                disabled={statusLoading || employee.statut === 'ACTIF'}
              >
                Activer
              </Button>
              <Button
                size="sm"
                variant={employee.statut === 'INACTIF' ? 'secondary' : 'secondary'}
                onClick={() => changeStatus('INACTIF')}
                disabled={statusLoading || employee.statut === 'INACTIF'}
              >
                Désactiver
              </Button>
              <Button
                size="sm"
                variant={employee.statut === 'SUSPENDU' ? 'danger' : 'danger'}
                onClick={() => changeStatus('SUSPENDU')}
                disabled={statusLoading || employee.statut === 'SUSPENDU'}
              >
                Suspendre
              </Button>
            </div>
            {statusLoading && (
              <p className="text-sm text-gray-500 mt-2">Changement en cours...</p>
            )}
          </div>
        </Card>

        {/* Informations détaillées */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations du compte */}
          <Card title="Informations du compte">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Nom d'utilisateur</p>
                <p className="font-medium text-gray-900">{employee.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prénom</p>
                <p className="font-medium text-gray-900">{employee.first_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-gray-900">{employee.last_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium text-gray-900">{employee.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rôle</p>
                <div>{getRoleBadge(employee.role)}</div>
              </div>
            </div>
          </Card>

          {/* Statut et activité */}
          <Card title="Statut et activité">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Statut actuel</p>
                </div>
                <div className="ml-6">{getStatusBadge(employee.statut)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Compte actif</p>
                </div>
                <p className="font-medium text-gray-900 ml-6">
                  {employee.is_active ? 'Oui' : 'Non'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Date de création</p>
                </div>
                <p className="font-medium text-gray-900 ml-6">
                  {new Date(employee.date_joined).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Dernière connexion</p>
                </div>
                <p className="font-medium text-gray-900 ml-6">
                  {employee.last_login 
                    ? new Date(employee.last_login).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Jamais connecté'
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Permissions */}
          <Card title="Permissions">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Gérer les employés</span>
                <span className={`font-medium ${employee.role === 'ADMIN' ? 'text-green-600' : 'text-red-600'}`}>
                  {employee.role === 'ADMIN' ? 'Autorisé' : 'Non autorisé'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Créer des clients</span>
                <span className="font-medium text-green-600">Autorisé</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Effectuer des transactions</span>
                <span className="font-medium text-green-600">Autorisé</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Activer des comptes</span>
                <span className="font-medium text-green-600">Autorisé</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Bloquer des comptes</span>
                <span className={`font-medium ${employee.role === 'ADMIN' ? 'text-green-600' : 'text-red-600'}`}>
                  {employee.role === 'ADMIN' ? 'Autorisé' : 'Non autorisé'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}