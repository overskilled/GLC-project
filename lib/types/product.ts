export interface Product {
  id: string
  sku: string
  barcode: string
  nom: string
  description?: string
  categorie?: string
  marque?: string
  origine?: string
  unite_mesure: string
  quantite_par_unite?: number
  couleur?: string
  taille?: string
  modele?: string
  version?: string
  date_fabrication?: string
  date_peremption?: string
  lot_number?: string
  statut: "Actif" | "Inactif" | "Archivé"
  devise: string
  couts: ProductCosts
  medias?: ProductMedia
}

export interface ProductCosts {
  achat_fournisseur: number
  transport: number
  assurance: number
  douane_taxes: number
  stockage: number
  autres_indirects: number
  total_revient: number
}

export interface ProductMedia {
  images_produit?: string[]
  image_code_barre?: string
  videos?: string[]
  documents?: ProductDocument[]
}

export interface ProductDocument {
  type: string
  titre: string
  url: string
}
