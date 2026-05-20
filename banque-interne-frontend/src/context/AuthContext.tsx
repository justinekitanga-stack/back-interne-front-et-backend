// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, LoginCredentials, User } from '@/types/auth';
import { authService } from '@/lib/auth';
import { AuthError } from '@/lib/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = authService.getUser();
    const savedToken = authService.getToken();
    
    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
      
      // Rediriger si déjà connecté et sur la page login
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        const redirectPath = savedUser.role === 'ADMIN' ? '/admin' : '/agent';
        router.push(redirectPath);
      }
    }
    
    setIsLoading(false);
  }, [router]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      
      // Vérifier la réponse
      console.log('Login response:', response);
      
      // Sauvegarder les tokens
      authService.saveTokens(response.access, response.refresh);
      
      // Corriger le user si first_name est vide
      const userData = {
        ...response.user,
        first_name: response.user.first_name || response.user.username,
        full_name: response.user.full_name || response.user.username
      };
      
      authService.saveUser(userData);
      
      setUser(userData);
      setToken(response.access);
      
      // Message de bienvenue
      const displayName = userData.first_name || userData.username;
      toast.success(`Bienvenue ${displayName} !`);
      
      // Redirection selon le rôle
      const redirectPath = userData.role === 'ADMIN' ? '/admin' : '/agent';
      
      // Utiliser window.location pour forcer la redirection
      window.location.href = redirectPath;
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof AuthError) {
        setError(error.message);
        toast.error(error.message);
      } else {
        const message = 'Une erreur inattendue est survenue';
        setError(message);
        toast.error(message);
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setError(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider> 
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}