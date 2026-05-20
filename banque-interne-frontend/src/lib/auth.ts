// src/lib/auth.ts
import api, { ApiError } from './api';
import { LoginCredentials, AuthResponse, User } from '@/types/auth';

export class AuthError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login/', credentials);
      return response.data;
    } catch (error: any) {
      // Reformater l'erreur pour l'auth
      const apiError = error as ApiError;
      
      if (apiError.status === 401) {
        throw new AuthError(
          'Nom d\'utilisateur ou mot de passe incorrect.',
          apiError.status
        );
      }
      
      if (apiError.status === 403) {
        throw new AuthError(
          'Votre compte est inactif ou suspendu. Contactez votre administrateur.',
          apiError.status
        );
      }
      
      throw new AuthError(
        apiError.message || 'Erreur lors de la connexion.',
        apiError.status,
        apiError.errors
      );
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get<{ status: string; data: User }>('/auth/profile/');
      return response.data.data;
    } catch (error: any) {
      const apiError = error as ApiError;
      throw new AuthError(
        apiError.message || 'Erreur lors de la récupération du profil.',
        apiError.status
      );
    }
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  saveTokens(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Aussi sauvegarder dans un cookie pour le middleware
    document.cookie = `access_token=${access}; path=/; max-age=28800; SameSite=Lax`;
  },


  saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },
};