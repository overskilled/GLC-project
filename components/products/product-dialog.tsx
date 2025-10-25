"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Product } from "@/lib/types/product"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const productSchema = z.object({
  sku: z.string().min(1, "SKU requis"),
  barcode: z.string().min(1, "Code-barres requis"),
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  categorie: z.string().optional(),
  marque: z.string().optional(),
  origine: z.string().optional(),
  unite_mesure: z.string().min(1, "Unité de mesure requise"),
  quantite_par_unite: z.coerce.number().optional(),
  couleur: z.string().optional(),
  taille: z.string().optional(),
  modele: z.string().optional(),
  version: z.string().optional(),
  statut: z.enum(["Actif", "Inactif", "Archivé"]),
  devise: z.string().min(1, "Devise requise"),
  achat_fournisseur: z.coerce.number().min(0, "Montant invalide"),
  transport: z.coerce.number().min(0, "Montant invalide"),
  assurance: z.coerce.number().min(0, "Montant invalide"),
  douane_taxes: z.coerce.number().min(0, "Montant invalide"),
  stockage: z.coerce.number().min(0, "Montant invalide"),
  autres_indirects: z.coerce.number().min(0, "Montant invalide"),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved: () => void
}

export function ProductDialog({ open, onOpenChange, product, onSaved }: ProductDialogProps) {
  const supabase = getSupabaseBrowserClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema as any),
    defaultValues: {
      sku: "",
      barcode: "",
      nom: "",
      description: "",
      categorie: "",
      marque: "",
      origine: "",
      unite_mesure: "pièce",
      statut: "Actif",
      devise: "EUR",
      achat_fournisseur: 0,
      transport: 0,
      assurance: 0,
      douane_taxes: 0,
      stockage: 0,
      autres_indirects: 0,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        barcode: product.barcode,
        nom: product.nom,
        description: product.description || "",
        categorie: product.categorie || "",
        marque: product.marque || "",
        origine: product.origine || "",
        unite_mesure: product.unite_mesure,
        quantite_par_unite: product.quantite_par_unite,
        couleur: product.couleur || "",
        taille: product.taille || "",
        modele: product.modele || "",
        version: product.version || "",
        statut: product.statut,
        devise: product.devise,
        achat_fournisseur: product.couts.achat_fournisseur,
        transport: product.couts.transport,
        assurance: product.couts.assurance,
        douane_taxes: product.couts.douane_taxes,
        stockage: product.couts.stockage,
        autres_indirects: product.couts.autres_indirects,
      })
    } else {
      reset({
        sku: "",
        barcode: "",
        nom: "",
        description: "",
        categorie: "",
        marque: "",
        origine: "",
        unite_mesure: "pièce",
        statut: "Actif",
        devise: "EUR",
        achat_fournisseur: 0,
        transport: 0,
        assurance: 0,
        douane_taxes: 0,
        stockage: 0,
        autres_indirects: 0,
      })
    }
  }, [product, reset])

  const costs = watch(["achat_fournisseur", "transport", "assurance", "douane_taxes", "stockage", "autres_indirects"])

  const totalCost = costs.reduce((sum, cost) => sum + (Number(cost) || 0), 0)

  const onSubmit = async (data: any) => {
    try {
      const productData = {
        sku: data.sku,
        barcode: data.barcode,
        nom: data.nom,
        description: data.description || null,
        categorie: data.categorie || null,
        marque: data.marque || null,
        origine: data.origine || null,
        unite_mesure: data.unite_mesure,
        quantite_par_unite: data.quantite_par_unite || null,
        couleur: data.couleur || null,
        taille: data.taille || null,
        modele: data.modele || null,
        version: data.version || null,
        statut: data.statut,
        devise: data.devise,
        couts: {
          achat_fournisseur: data.achat_fournisseur,
          transport: data.transport,
          assurance: data.assurance,
          douane_taxes: data.douane_taxes,
          stockage: data.stockage,
          autres_indirects: data.autres_indirects,
          total_revient: totalCost,
        },
      }

      if (product) {
        const { error } = await supabase.from("products").update(productData).eq("id", product.id)

        if (error) throw error

        toast.success( "Le produit a été modifié avec succès")
      } else {
        const { error } = await supabase.from("products").insert(productData)

        if (error) throw error

        toast.success("Le produit a été ajouté avec succès")
      }

      onSaved()
    } catch (error) {
      console.error("[v0] Error saving product:", error)
      toast.error("Impossible de sauvegarder le produit")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
          <DialogDescription>
            {product ? "Modifiez les informations du produit" : "Ajoutez un nouveau produit au catalogue"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="costs">Coûts</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" {...register("sku")} placeholder="SKU-PROD-001" />
                  {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Code-barres *</Label>
                  <Input id="barcode" {...register("barcode")} placeholder="3700191234567" />
                  {errors.barcode && <p className="text-sm text-destructive">{errors.barcode.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom du produit *</Label>
                <Input id="nom" {...register("nom")} placeholder="Nom du produit" />
                {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} placeholder="Description du produit" rows={3} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Input id="categorie" {...register("categorie")} placeholder="EPI / Protection" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marque">Marque</Label>
                  <Input id="marque" {...register("marque")} placeholder="Marque" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut *</Label>
                  <Select onValueChange={(value) => setValue("statut", value as any)} defaultValue={watch("statut")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                      <SelectItem value="Archivé">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origine">Origine</Label>
                  <Input id="origine" {...register("origine")} placeholder="France" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unite_mesure">Unité de mesure *</Label>
                  <Input id="unite_mesure" {...register("unite_mesure")} placeholder="pièce" />
                  {errors.unite_mesure && <p className="text-sm text-destructive">{errors.unite_mesure.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantite_par_unite">Quantité par unité</Label>
                  <Input
                    id="quantite_par_unite"
                    type="number"
                    step="0.01"
                    {...register("quantite_par_unite")}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="couleur">Couleur</Label>
                  <Input id="couleur" {...register("couleur")} placeholder="Bleu" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taille">Taille</Label>
                  <Input id="taille" {...register("taille")} placeholder="M" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modele">Modèle</Label>
                  <Input id="modele" {...register("modele")} placeholder="Standard" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input id="version" {...register("version")} placeholder="v1.0" />
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="devise">Devise *</Label>
                <Input id="devise" {...register("devise")} placeholder="EUR" />
                {errors.devise && <p className="text-sm text-destructive">{errors.devise.message}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="achat_fournisseur">Achat fournisseur *</Label>
                  <Input
                    id="achat_fournisseur"
                    type="number"
                    step="0.01"
                    {...register("achat_fournisseur")}
                    placeholder="0.00"
                  />
                  {errors.achat_fournisseur && (
                    <p className="text-sm text-destructive">{errors.achat_fournisseur.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transport">Transport *</Label>
                  <Input id="transport" type="number" step="0.01" {...register("transport")} placeholder="0.00" />
                  {errors.transport && <p className="text-sm text-destructive">{errors.transport.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assurance">Assurance *</Label>
                  <Input id="assurance" type="number" step="0.01" {...register("assurance")} placeholder="0.00" />
                  {errors.assurance && <p className="text-sm text-destructive">{errors.assurance.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="douane_taxes">Douane & Taxes *</Label>
                  <Input id="douane_taxes" type="number" step="0.01" {...register("douane_taxes")} placeholder="0.00" />
                  {errors.douane_taxes && <p className="text-sm text-destructive">{errors.douane_taxes.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stockage">Stockage *</Label>
                  <Input id="stockage" type="number" step="0.01" {...register("stockage")} placeholder="0.00" />
                  {errors.stockage && <p className="text-sm text-destructive">{errors.stockage.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autres_indirects">Autres coûts indirects *</Label>
                  <Input
                    id="autres_indirects"
                    type="number"
                    step="0.01"
                    {...register("autres_indirects")}
                    placeholder="0.00"
                  />
                  {errors.autres_indirects && (
                    <p className="text-sm text-destructive">{errors.autres_indirects.message}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Coût de revient total</span>
                  <span className="text-lg font-bold">
                    {totalCost.toFixed(2)} {watch("devise")}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : product ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
