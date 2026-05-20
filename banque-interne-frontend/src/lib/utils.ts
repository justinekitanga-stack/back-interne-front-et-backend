// src/lib/utils.ts
export const getMediaUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8000';
  
  if (!path) return '';
  
  // Si l'URL est déjà complète
  if (path.startsWith('http')) return path;
  
  // Ajouter le / si nécessaire
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};

export const getApiUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  return `${baseUrl}${path}`;
};

// Formater les montants
export const formatCurrency = (amount: string | number): string => {
  return Number(amount).toLocaleString('fr-FR') + ' USD';
};

// Formater les dates
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Statut client
export const getClientStatusLabel = (statut: string): string => {
  const statuses: Record<string, string> = {
    'ACTIF': 'Actif',
    'INACTIF': 'Inactif',
    'BLOQUE': 'Bloqué',
    'CLOTURE': 'Clôturé'
  };
  return statuses[statut] || statut;
};

export const getClientStatusColor = (statut: string): string => {
  const colors: Record<string, string> = {
    'ACTIF': 'success',
    'INACTIF': 'warning',
    'BLOQUE': 'danger',
    'CLOTURE': 'default'
  };
  return colors[statut] || 'default';
};

// Type de compte
export const getTypeCompteLabel = (type: string): string => {
  const types: Record<string, string> = {
    'EPARGNE': 'Épargne',
    'COURANT': 'Courant',
    'SALAIRE': 'Salaire'
  };
  return types[type] || type;
};