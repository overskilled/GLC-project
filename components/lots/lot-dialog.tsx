"use client"

import { useEffect, useState } from "react"
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
import type { Lot } from "@/lib/types/shipment"
import type { Product } from "@/lib/types/product"
import type { Shipment } from "@/lib/types/shipment"
import { toast } from "sonner"

const lotSchema = z.object({
  id_lot: z.string().min(1, "ID lot requis"),
  id_produit: z.string().min(1, "Produit requis"),
  id_expedition: z.string().min(1, "Expédition requise"),
  sku_physique: z.string().min(1, "SKU physique requis"),
  cout_achat_unitaire: z.coerce.number().min(0, "Montant invalide"),
  quantite_totale: z.coerce.number().min(1, "Quantité requise"),
  poids_total_kg: z.coerce.number().optional(),
  volume_total_m3: z.coerce.number().optional(),
  date_peremption: z.string().optional(),
  statut: z.enum(["En stock", "Épuisé", "Supprimé"]),
})

type LotFormValues = z.infer<typeof lotSchema>

interface LotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lot: Lot | null
  onSaved: () => void
}

export function LotDialog({ open, onOpenChange, lot, onSaved }: LotDialogProps) {
  const supabase = getSupabaseBrowserClient()
  const [products, setProducts] = useState<Product[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema as any),
    defaultValues: {
      id_lot: "",
      id_produit: "",
      id_expedition: "",
      sku_physique: "",
      cout_achat_unitaire: 0,
      quantite_totale: 1,
      poids_total_kg: undefined,
      volume_total_m3: undefined,
      date_peremption: "",
      statut: "En stock",
    },
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (lot) {
      reset({
        id_lot: lot.id,
        id_produit: lot.id_produit,
        id_expedition: lot.id_expedition,
        sku_physique: lot.sku_physique,
        cout_achat_unitaire: lot.prix_achat_unitaire,
        quantite_totale: lot.quantite,
        poids_total_kg: lot.poids_total_kg,
        volume_total_m3: lot.volume_total_m3,
        date_peremption: lot.date_peremption || "",
        statut: lot.statut,
      })
    } else {
      reset({
        id_lot: "",
        id_produit: "",
        id_expedition: "",
        sku_physique: "",
        cout_achat_unitaire: 0,
        quantite_totale: 1,
        poids_total_kg: undefined,
        volume_total_m3: undefined,
        date_peremption: "",
        statut: "En stock",
      })
    }
  }, [lot, reset])

  const loadData = async () => {
    setIsLoadingData(true)
    try {
      const [productsResult, shipmentsResult] = await Promise.all([
        supabase.from("products").select("*").order("nom"),
        supabase.from("shipments").select("*").order("date_depart", { ascending: false }),
      ])

      if (productsResult.error) throw productsResult.error
      if (shipmentsResult.error) throw shipmentsResult.error

      setProducts(productsResult.data || [])
      setShipments(shipmentsResult.data || [])
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast("Impossible de charger les données")
    } finally {
      setIsLoadingData(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const lotData = {
        id_lot: data.id_lot,
        id_produit: data.id_produit,
        id_expedition: data.id_expedition,
        sku_physique: data.sku_physique,
        cout_achat_unitaire: data.cout_achat_unitaire,
        quantite_totale: data.quantite_totale,
        poids_total_kg: data.poids_total_kg || null,
        volume_total_m3: data.volume_total_m3 || null,
        date_peremption: data.date_peremption || null,
        statut: data.statut,
      }

      if (lot) {
        const { error } = await supabase.from("physical_lots").update(lotData).eq("id_lot", lot.id)

        if (error) throw error

        toast.success("Le lot a été modifié avec succès")
      } else {
        const { error } = await supabase.from("physical_lots").insert(lotData)

        if (error) throw error

        toast.success("Le lot a été créé avec succès")
      }

      onSaved()
    } catch (error) {
      console.error("[v0] Error saving lot:", error)
      toast.error("Impossible de sauvegarder le lot")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lot ? "Modifier le lot" : "Nouveau lot"}</DialogTitle>
          <DialogDescription>
            {lot ? "Modifiez les informations du lot" : "Créez un nouveau lot physique"}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="id_lot">ID Lot *</Label>
                    <Input id="id_lot" {...register("id_lot")} placeholder="LOT-2025-001" disabled={!!lot} />
                    {errors.id_lot && <p className="text-sm text-destructive">{errors.id_lot.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku_physique">SKU Physique *</Label>
                    <Input id="sku_physique" {...register("sku_physique")} placeholder="SKU-PHYS-001" />
                    {errors.sku_physique && <p className="text-sm text-destructive">{errors.sku_physique.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_produit">Produit *</Label>
                  <Select
                    onValueChange={(value) => setValue("id_produit", value)}
                    defaultValue={watch("id_produit")}
                    disabled={products.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.nom} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.id_produit && <p className="text-sm text-destructive">{errors.id_produit.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_expedition">Expédition *</Label>
                  <Select
                    onValueChange={(value) => setValue("id_expedition", value)}
                    defaultValue={watch("id_expedition")}
                    disabled={shipments.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une expédition" />
                    </SelectTrigger>
                    <SelectContent>
                      {shipments.map((shipment) => (
                        <SelectItem key={shipment.id} value={shipment.id}>
                          {shipment.fournisseur} - {shipment.reference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.id_expedition && <p className="text-sm text-destructive">{errors.id_expedition.message}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantite_totale">Quantité totale *</Label>
                    <Input
                      id="quantite_totale"
                      type="number"
                      step="1"
                      {...register("quantite_totale")}
                      placeholder="100"
                    />
                    {errors.quantite_totale && (
                      <p className="text-sm text-destructive">{errors.quantite_totale.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cout_achat_unitaire">Coût achat unitaire *</Label>
                    <Input
                      id="cout_achat_unitaire"
                      type="number"
                      step="0.01"
                      {...register("cout_achat_unitaire")}
                      placeholder="0.00"
                    />
                    {errors.cout_achat_unitaire && (
                      <p className="text-sm text-destructive">{errors.cout_achat_unitaire.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut *</Label>
                  <Select onValueChange={(value) => setValue("statut", value as any)} defaultValue={watch("statut")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En stock">En stock</SelectItem>
                      <SelectItem value="Épuisé">Épuisé</SelectItem>
                      <SelectItem value="Supprimé">Supprimé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="poids_total_kg">Poids total (kg)</Label>
                    <Input
                      id="poids_total_kg"
                      type="number"
                      step="0.01"
                      {...register("poids_total_kg")}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volume_total_m3">Volume total (m³)</Label>
                    <Input
                      id="volume_total_m3"
                      type="number"
                      step="0.001"
                      {...register("volume_total_m3")}
                      placeholder="0.000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_peremption">Date de péremption</Label>
                  <Input id="date_peremption" type="date" {...register("date_peremption")} />
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantité totale</span>
                      <span className="text-sm font-semibold">{watch("quantite_totale") || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Coût unitaire</span>
                      <span className="text-sm font-semibold">{(watch("cout_achat_unitaire") || 0).toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-medium">Valeur totale du lot</span>
                      <span className="text-lg font-bold">
                        {((watch("quantite_totale") || 0) * (watch("cout_achat_unitaire") || 0)).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : lot ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
