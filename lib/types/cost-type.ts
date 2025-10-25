export interface CostType {
  id: string
  nom: string
  code: string
  description?: string
  categorie: "Direct" | "Indirect" | "Fixe" | "Variable"
  unite_calcul?: string
  taux_defaut?: number
  actif: boolean
  created_at?: string
  updated_at?: string
}
