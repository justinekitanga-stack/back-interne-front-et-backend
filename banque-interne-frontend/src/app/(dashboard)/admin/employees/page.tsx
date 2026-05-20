// src/app/(dashboard)/admin/employees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { UserPlus, Search } from 'lucide-react';
import api from '@/lib/api';
import { Employee } from '@/types/employee';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/employees/');
      setEmployees(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.username.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.first_name.toLowerCase().includes(search.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(search.toLowerCase())
  );

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
      case 'ADMIN': return <Badge variant="info">Admin</Badge>;
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employés</h1>
          <p className="text-gray-500 mt-1">Gestion des employés de la banque</p>
        </div>
        <Button 
          onClick={() => router.push('/admin/employees/create')}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Nouvel employé
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un employé..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Liste des employés */}
      <Card>
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucun employé trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID Employé</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nom</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rôle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date d&apos;ajout</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr 
                    key={employee.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/employees/${employee.employee_id}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">{employee.employee_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-gray-500">@{employee.username}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="py-3 px-4">{getRoleBadge(employee.role)}</td>
                    <td className="py-3 px-4">{getStatusBadge(employee.statut)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(employee.date_joined).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}