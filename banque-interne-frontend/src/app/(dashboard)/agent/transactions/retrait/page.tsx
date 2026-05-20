// src/app/(dashboard)/agent/transactions/retrait/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function RetraitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);

  const [formData, setFormData] = useState({
    numero_compte: searchParams.get('compte') || '',
    montant: '',
    description: '',
  });

  const [clientInfo, setClientInfo] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (formData.numero_compte.length === 12) {
      searchClient();
    } else {
      setClientInfo(null);
    }
  }, [formData.numero_compte]);

  const searchClient = async () => {
    try {
      setSearching(true);
      const response = await api.get('/clients/solde/', {
        params: { numero_compte: formData.numero_compte }
      });
      setClientInfo(response.data.data);
    } catch (error) {
      setClientInfo(null);
    } finally {
      setSearching(false);
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
    
    if (!formData.numero_compte || !formData.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (clientInfo && parseFloat(formData.montant) > parseFloat(clientInfo.solde)) {
      toast.error('Solde insuffisant pour ce retrait');
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      const response = await api.post('/transactions/retrait/', {
        numero_compte: formData.numero_compte,
        montant: parseFloat(formData.montant),
        description: formData.description,
      });

      setSuccess(true);
      setTransaction(response.data.data);
      toast.success('Retrait effectué avec succès !');
      
      setFormData({
        numero_compte: '',
        montant: '',
        description: '',
      });
      setClientInfo(null);
      
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
        toast.error('Veuillez corriger les erreurs');
      } else {
        toast.error(error.message || 'Erreur lors du retrait');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNouveauRetrait = () => {
    setSuccess(false);
    setTransaction(null);
  };

  const montant = parseFloat(formData.montant || '0');
  const soldeActuel = clientInfo ? parseFloat(clientInfo.solde) : 0;
  const soldeInsuffisant = montant > soldeActuel;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retrait</h1>
          <p className="text-gray-500">Effectuer un retrait sur un compte</p>
        </div>
      </div>

      {success && transaction ? (
        // Écran de succès
        <Card>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Retrait effectué !</h2>
            <p className="text-gray-500 mb-6">La transaction a été effectuée avec succès</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Référence</span>
                  <span className="font-mono font-medium">{transaction.transaction.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compte</span>
                  <span className="font-medium">{transaction.resume.numero_compte || formData.numero_compte}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant retiré</span>
                  <span className="font-bold text-red-600">-{transaction.resume.montant_retire} USD</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ancien solde</span>
                    <span>{transaction.resume.ancien_solde} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nouveau solde</span>
                    <span className="font-bold text-blue-600">{transaction.resume.nouveau_solde} USD</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push('/agent/transactions')}>
                Voir l'historique
              </Button>
              <Button onClick={handleNouveauRetrait}>
                Nouveau retrait
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        // Formulaire
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="space-y-6">
              {/* Numéro de compte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de compte *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={formData.numero_compte}
                    onChange={(e) => updateField('numero_compte', e.target.value.replace(/\D/g, ''))}
                    placeholder="Entrez les 12 chiffres du compte"
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                      errors.numero_compte ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errors.numero_compte && (
                  <p className="mt-1 text-sm text-red-600">{errors.numero_compte[0]}</p>
                )}

                {/* Info client */}
                {clientInfo && (
                  <div className={`mt-3 p-4 border rounded-lg ${
                    clientInfo.statut === 'Actif' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{clientInfo.nom_client}</p>
                        <p className="text-sm text-gray-600">
                          {clientInfo.type_compte}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Solde disponible</p>
                        <p className={`font-bold text-lg ${
                          soldeInsuffisant ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {clientInfo.solde} USD
                        </p>
                      </div>
                    </div>
                    {clientInfo.statut !== 'Actif' && (
                      <p className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                        ⚠️ Ce compte n'est pas actif. Retrait impossible.
                      </p>
                    )}
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
                      errors.montant || soldeInsuffisant 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.montant && (
                  <p className="mt-1 text-sm text-red-600">{errors.montant[0]}</p>
                )}
                {soldeInsuffisant && (
                  <p className="mt-1 text-sm text-red-600">
                    Solde insuffisant. Disponible : {soldeActuel.toLocaleString()} USD
                  </p>
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
                  placeholder="Motif du retrait..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Résumé */}
              {clientInfo && formData.montant && !soldeInsuffisant && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Résumé de l'opération</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Solde actuel</span>
                      <span>{soldeActuel.toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant du retrait</span>
                      <span className="text-red-600 font-medium">-{montant.toLocaleString()} USD</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-gray-900 font-medium">Nouveau solde</span>
                      <span className="text-blue-600 font-bold">
                        {(soldeActuel - montant).toLocaleString()} USD
                      </span>
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
                  variant="danger"
                  isLoading={loading}
                  disabled={!clientInfo || clientInfo.statut !== 'Actif' || soldeInsuffisant}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Effectuer le retrait
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}