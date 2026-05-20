// src/app/(dashboard)/admin/transactions/transfert/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, ArrowRightLeft, Search } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function TransfertPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);

  const [formData, setFormData] = useState({
    compte_source: '',
    compte_dest: '',
    montant: '',
    description: '',
  });

  const [compteSource, setCompteSource] = useState<any>(null);
  const [compteDest, setCompteDest] = useState<any>(null);
  const [searchingSource, setSearchingSource] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  // Recherche compte source
  useEffect(() => {
    if (formData.compte_source.length === 12) {
      searchCompte(formData.compte_source, setCompteSource, setSearchingSource);
    } else {
      setCompteSource(null);
    }
  }, [formData.compte_source]);

  // Recherche compte destination
  useEffect(() => {
    if (formData.compte_dest.length === 12) {
      searchCompte(formData.compte_dest, setCompteDest, setSearchingDest);
    } else {
      setCompteDest(null);
    }
  }, [formData.compte_dest]);

  const searchCompte = async (numero: string, setter: any, loadingSetter: any) => {
    try {
      loadingSetter(true);
      const response = await api.get('/clients/solde/', {
        params: { numero_compte: numero }
      });
      setter(response.data.data);
    } catch (error) {
      setter(null);
    } finally {
      loadingSetter(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.compte_source || !formData.compte_dest || !formData.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.compte_source === formData.compte_dest) {
      toast.error('Impossible de transférer vers le même compte');
      return;
    }

    const montantNum = parseFloat(formData.montant);
    if (compteSource && montantNum > parseFloat(compteSource.solde)) {
      toast.error('Solde insuffisant sur le compte source');
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      const response = await api.post('/transactions/transfert/', {
        compte_source: formData.compte_source,
        compte_dest: formData.compte_dest,
        montant: montantNum,
        description: formData.description,
      });

      setSuccess(true);
      setTransaction(response.data.data);
      toast.success('Transfert effectué avec succès !');
      
      // Réinitialiser
      setFormData({
        compte_source: '',
        compte_dest: '',
        montant: '',
        description: '',
      });
      setCompteSource(null);
      setCompteDest(null);
      
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
        toast.error('Veuillez corriger les erreurs');
      } else {
        toast.error(error.message || 'Erreur lors du transfert');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNouveauTransfert = () => {
    setSuccess(false);
    setTransaction(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfert</h1>
          <p className="text-gray-500">Transférer de l'argent entre deux comptes</p>
        </div>
      </div>

      {success && transaction ? (
        <Card>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRightLeft className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfert effectué !</h2>
            <p className="text-gray-500 mb-6">Le transfert a été effectué avec succès</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 max-w-lg mx-auto">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Compte source</p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-medium">{transaction.source.client}</p>
                    <p className="text-sm text-gray-500">{transaction.source.compte}</p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>Ancien solde</span>
                      <span>{transaction.source.ancien_solde} USD</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Nouveau solde</span>
                      <span className="font-bold">{transaction.source.nouveau_solde} USD</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRightLeft className="h-6 w-6 text-blue-600" />
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Compte destination</p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-medium">{transaction.destination.client}</p>
                    <p className="text-sm text-gray-500">{transaction.destination.compte}</p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>Ancien solde</span>
                      <span>{transaction.destination.ancien_solde} USD</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Nouveau solde</span>
                      <span className="font-bold">{transaction.destination.nouveau_solde} USD</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant transféré</span>
                    <span className="font-bold text-blue-600">{formData.montant} USD</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push('/admin/transactions')}>
                Voir l'historique
              </Button>
              <Button onClick={handleNouveauTransfert}>
                Nouveau transfert
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="space-y-6">
              {/* Compte source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compte source *
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={formData.compte_source}
                  onChange={(e) => updateField('compte_source', e.target.value.replace(/\D/g, ''))}
                  placeholder="Numéro du compte à débiter"
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                    errors.compte_source ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.compte_source && (
                  <p className="mt-1 text-sm text-red-600">{errors.compte_source[0]}</p>
                )}
                {compteSource && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between">
                    <div>
                      <p className="font-medium">{compteSource.nom_client}</p>
                      <p className="text-sm text-gray-600">{compteSource.type_compte}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Solde</p>
                      <p className="font-bold text-blue-900">{compteSource.solde} USD</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Flèche transfert */}
              <div className="flex justify-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <ArrowRightLeft className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Compte destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compte destination *
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={formData.compte_dest}
                  onChange={(e) => updateField('compte_dest', e.target.value.replace(/\D/g, ''))}
                  placeholder="Numéro du compte à créditer"
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                    errors.compte_dest ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.compte_dest && (
                  <p className="mt-1 text-sm text-red-600">{errors.compte_dest[0]}</p>
                )}
                {compteDest && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between">
                    <div>
                      <p className="font-medium">{compteDest.nom_client}</p>
                      <p className="text-sm text-gray-600">{compteDest.type_compte}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Solde</p>
                      <p className="font-bold text-green-700">{compteDest.solde} USD</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={formData.montant}
                    onChange={(e) => updateField('montant', e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-10 pr-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.montant ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.montant && (
                  <p className="mt-1 text-sm text-red-600">{errors.montant[0]}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Motif du transfert..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Résumé */}
              {compteSource && compteDest && formData.montant && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Résumé du transfert</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">De</span>
                      <span>{compteSource.nom_client} ({compteSource.solde} USD)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vers</span>
                      <span>{compteDest.nom_client} ({compteDest.solde} USD)</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Montant</span>
                      <span className="font-bold text-blue-600">{parseFloat(formData.montant).toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  isLoading={loading}
                  disabled={
                    !compteSource || !compteDest || 
                    compteSource.statut !== 'Actif' || 
                    compteDest.statut !== 'Actif'
                  }
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Effectuer le transfert
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}