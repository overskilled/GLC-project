export interface Shipment {
  id: string
  reference: string
  date_depart: string
  date_reception?: string
  id_expedition: string
  fournisseur: string
  cout_total: number
  cout_total_douane: number
  cout_total_transport: number
  cout_total_assurance: number
  cout_total_manutention: number
  devise: string
  statut: "Préparation" | "En transit" | "Réceptionnée" | "Clôturée"
}

export interface Lot {
  id: string
  id_produit: string
  id_expedition: string
  sku_physique: string
  prix_achat_unitaire: number
  quantite: number
  poids_total_kg?: number
  volume_total_m3?: number
  date_peremption?: string
  statut: "En stock" | "Épuisé" | "Supprimé"
}

export interface CostAllocationKey {
  id_cle: string
  nom: string
  unite_reference: "Valeur" | "Poids" | "Volume" | "Quantité"
  formule: string
  actif: boolean
}
