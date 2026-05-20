// src/app/(dashboard)/admin/clients/create/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ClientFormData {
  nom: string;
  post_nom: string;
  prenom: string;
  email: string;
  telephone: string;
  birthday: string;
  genre: 'M' | 'F';
  devise: 'USD';
  type_compte: 'EPARGNE' | 'COURANT' | 'SALAIRE';
}

export default function CreateClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  // Refs pour les inputs file
  const carteIdentiteRef = useRef<HTMLInputElement>(null);
  const photoPasseportRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ClientFormData>({
    nom: '',
    post_nom: '',
    prenom: '',
    email: '',
    telephone: '',
    birthday: '',
    genre: 'M',
    devise: 'USD',
    type_compte: 'EPARGNE',
  });

  const [carteIdentite, setCarteIdentite] = useState<File | null>(null);
  const [carteIdentitePreview, setCarteIdentitePreview] = useState<string>('');
  
  const [photoPasseport, setPhotoPasseport] = useState<File | null>(null);
  const [photoPasseportPreview, setPhotoPasseportPreview] = useState<string>('');

  // Gestion des fichiers
  const handleFileChange = (
    file: File | null,
    setFile: (file: File | null) => void,
    setPreview: (preview: string) => void
  ) => {
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFile(null);
      setPreview('');
    }
  };

  const removeFile = (
    setFile: (file: File | null) => void,
    setPreview: (preview: string) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    setFile(null);
    setPreview('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const updateField = (field: keyof ClientFormData, value: string) => {
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
    setLoading(true);
    setErrors({});

    if (!carteIdentite) {
      toast.error('La carte d\'identité est requise');
      setLoading(false);
      return;
    }
    if (!photoPasseport) {
      toast.error('La photo passeport est requise');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      formDataToSend.append('carte_identite', carteIdentite);
      formDataToSend.append('photo_passeport', photoPasseport);

      const response = await api.post('/clients/create/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Client créé avec succès !');
      
      const data = response.data.data;
      if (data.client) {
        toast.success(
          `Compte créé : ${data.client.numero_compte}`,
          { duration: 5000 }
        );
      }

      router.push('/admin/clients');
      
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
        toast.error('Veuillez corriger les erreurs');
      } else {
        toast.error(error.message || 'Erreur lors de la création');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
          <p className="text-gray-500">Créer un compte bancaire</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-8">
            {/* Identité */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Identité du client</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nom ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post-nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.post_nom}
                    onChange={(e) => updateField('post_nom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => updateField('prenom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={formData.telephone}
                    onChange={(e) => updateField('telephone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthday}
                    onChange={(e) => updateField('birthday', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => updateField('genre', e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carte d'identité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carte d'identité *
                  </label>
                  
                  {carteIdentite ? (
                    <div className="relative border rounded-lg p-2">
                      <button
                        type="button"
                        onClick={() => removeFile(setCarteIdentite, setCarteIdentitePreview, carteIdentiteRef)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <img
                        src={carteIdentitePreview}
                        alt="Carte d'identité"
                        className="h-40 w-full object-contain rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate">{carteIdentite.name}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => carteIdentiteRef.current?.click()}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Cliquez pour sélectionner</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 5MB)</p>
                    </button>
                  )}
                  
                  <input
                    ref={carteIdentiteRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileChange(file, setCarteIdentite, setCarteIdentitePreview);
                    }}
                  />
                </div>

                {/* Photo passeport */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo passeport *
                  </label>
                  
                  {photoPasseport ? (
                    <div className="relative border rounded-lg p-2">
                      <button
                        type="button"
                        onClick={() => removeFile(setPhotoPasseport, setPhotoPasseportPreview, photoPasseportRef)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <img
                        src={photoPasseportPreview}
                        alt="Photo passeport"
                        className="h-40 w-full object-contain rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate">{photoPasseport.name}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => photoPasseportRef.current?.click()}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Cliquez pour sélectionner</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 5MB)</p>
                    </button>
                  )}
                  
                  <input
                    ref={photoPasseportRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileChange(file, setPhotoPasseport, setPhotoPasseportPreview);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Compte */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Type de compte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de compte *</label>
                  <select
                    value={formData.type_compte}
                    onChange={(e) => updateField('type_compte', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EPARGNE">Compte Épargne</option>
                    <option value="COURANT">Compte Courant</option>
                    <option value="SALAIRE">Compte Salaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <input
                    type="text"
                    value="USD - Dollar Américain"
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button type="submit" isLoading={loading}>
                Créer le compte
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}