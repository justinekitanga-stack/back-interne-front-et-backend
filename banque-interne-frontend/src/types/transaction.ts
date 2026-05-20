// src/types/transaction.ts
export interface Transaction {
  id: number;
  reference: string;
  type_transaction: 'DEPOT' | 'RETRAIT';
  type_transaction_display: string;
  montant: string;
  nom_client: string;
  numero_compte: string;
  statut: 'REUSSIE' | 'ECHOUEE' | 'ANNULEE';
  effectue_par_nom: string;
  created_at: string;
}

export interface DepotData {
  numero_compte: string;
  montant: number;
  description?: string;
}

export interface RetraitData {
  numero_compte: string;
  montant: number;
  description?: string;
}