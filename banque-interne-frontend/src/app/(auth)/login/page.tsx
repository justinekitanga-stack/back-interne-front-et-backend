// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!username.trim()) {
      setLocalError('Veuillez entrer votre nom d\'utilisateur');
      return;
    }
    if (!password) {
      setLocalError('Veuillez entrer votre mot de passe');
      return;
    }
    
    setLoading(true);
    setLocalError('');
    
    try {
      await login({ username: username.trim(), password });
    } catch (error: any) {
      // L'erreur est déjà gérée par le AuthContext
      // Mais on peut aussi l'afficher localement
      if (error.message) {
        setLocalError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Banque Interne
          </h1>
          <p className="text-gray-600 mt-2">
            Portail employé - Connectez-vous
          </p>
        </div>

        {/* Message d'erreur */}
        {localError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Erreur de connexion</p>
              <p className="text-sm text-red-700 mt-1">{localError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setLocalError('');
              }}
              className={`
                block w-full px-4 py-2.5 border rounded-lg shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${localError ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Entrez votre nom d'utilisateur"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError('');
                }}
                className={`
                  block w-full px-4 py-2.5 border rounded-lg shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  pr-10
                  ${localError ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full flex justify-center items-center gap-2 py-2.5 px-4 
              border border-transparent rounded-lg shadow-sm text-sm font-medium 
              text-white bg-blue-600 hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connexion en cours...</span>
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Application réservée aux employés de la banque
          </p>
        </div>
      </div>
    </div>
  );
}