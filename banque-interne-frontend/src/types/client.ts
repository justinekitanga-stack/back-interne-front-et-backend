// src/types/client.ts
export interface Client {
  id: number;
  nom: string;
  post_nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  telephone: string;
  birthday: string;
  age: number;
  genre: 'M' | 'F';
  carte_identite: string;
  photo_passeport: string;
  numero_compte: string;
  devise: 'USD';
  type_compte: 'EPARGNE' | 'COURANT' | 'SALAIRE';
  solde: string;
  statut: 'INACTIF' | 'ACTIF' | 'BLOQUE' | 'CLOTURE';
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreateData {
  nom: string;
  post_nom: string;
  prenom: string;
  email: string;
  telephone: string;
  birthday: string;
  genre: 'M' | 'F';
  carte_identite: File | null;
  photo_passeport: File | null;
  devise: 'USD';
  type_compte: 'EPARGNE' | 'COURANT' | 'SALAIRE';
}