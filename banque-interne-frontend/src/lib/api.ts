// src/lib/api.ts
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types pour les erreurs
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Formater l'erreur
    const apiError: ApiError = {
      message: 'Une erreur est survenue',
      status: error.response?.status,
    };

    if (error.response?.data) {
      const data = error.response.data as any;

      // Erreur Django REST standard
      if (data.detail) {
        apiError.message = data.detail;
      }

      // Erreurs de validation (format DRF)
      if (typeof data === 'object' && !data.detail) {
        apiError.errors = {};
        Object.keys(data).forEach((key) => {
          const value = data[key];
          if (Array.isArray(value)) {
            apiError.errors![key] = value;
          } else if (typeof value === 'string') {
            apiError.errors![key] = [value];
          }
        });
        
        // Message par défaut pour les erreurs de validation
        const firstError = Object.values(apiError.errors)[0];
        if (firstError && firstError.length > 0) {
          apiError.message = firstError[0];
        }
      }

      // Message d'erreur personnalisé du backend
      if (data.message) {
        apiError.message = data.message;
      }

      // Format avec status/error
      if (data.status === 'error' && data.message) {
        apiError.message = data.message;
        if (data.errors) {
          apiError.errors = data.errors;
        }
      }
    }

    // Erreurs réseau
    if (error.code === 'ERR_NETWORK') {
      apiError.message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    }

    return Promise.reject(apiError);
  }
);

export default api;
export type { ApiError };