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
import type { Shipment } from "@/lib/types/shipment"
import { toast } from "sonner"

const shipmentSchema = z.object({
  id_expedition: z.string().min(1, "ID expédition requis"),
  ref_conteneur: z.string().min(1, "Référence conteneur requise"),
  date_depart: z.string().min(1, "Date de départ requise"),
  date_reception: z.string().optional(),
  fournisseur: z.string().min(1, "Fournisseur requis"),
  cout_total_douane: z.coerce.number().min(0, "Montant invalide"),
  cout_total_transport: z.coerce.number().min(0, "Montant invalide"),
  cout_total_assurance: z.coerce.number().min(0, "Montant invalide"),
  cout_total_manutention: z.coerce.number().min(0, "Montant invalide"),
  devise: z.string().min(1, "Devise requise"),
  statut: z.enum(["Préparation", "En transit", "Réceptionnée", "Clôturée"]),
})

type ShipmentFormValues = z.infer<typeof shipmentSchema>

interface ShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: Shipment | null
  onSaved: () => void
}

export function ShipmentDialog({ open, onOpenChange, shipment, onSaved }: ShipmentDialogProps) {
  const supabase = getSupabaseBrowserClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema as any),
    defaultValues: {
      id_expedition: "",
      ref_conteneur: "",
      date_depart: "",
      date_reception: "",
      fournisseur: "",
      cout_total_douane: 0,
      cout_total_transport: 0,
      cout_total_assurance: 0,
      cout_total_manutention: 0,
      devise: "EUR",
      statut: "Préparation",
    },
  })

  useEffect(() => {
    if (shipment) {
      reset({
        id_expedition: shipment.id_expedition,
        ref_conteneur: shipment.reference,
        date_depart: shipment.date_depart,
        date_reception: shipment.date_reception || "",
        fournisseur: shipment.fournisseur,
        cout_total_douane: shipment.cout_total_douane,
        cout_total_transport: shipment.cout_total_transport,
        cout_total_assurance: shipment.cout_total_assurance,
        cout_total_manutention: shipment.cout_total_manutention,
        devise: shipment.devise,
        statut: shipment.statut,
      })
    } else {
      reset({
        id_expedition: "",
        ref_conteneur: "",
        date_depart: "",
        date_reception: "",
        fournisseur: "",
        cout_total_douane: 0,
        cout_total_transport: 0,
        cout_total_assurance: 0,
        cout_total_manutention: 0,
        devise: "EUR",
        statut: "Préparation",
      })
    }
  }, [shipment, reset])

  const costs = watch(["cout_total_douane", "cout_total_transport", "cout_total_assurance", "cout_total_manutention"])

  const totalCost = costs.reduce((sum, cost) => sum + (Number(cost) || 0), 0)

  const onSubmit = async (data: any) => {
    try {
      const shipmentData = {
        id_expedition: data.id_expedition,
        ref_conteneur: data.ref_conteneur,
        date_depart: data.date_depart,
        date_reception: data.date_reception || null,
        fournisseur: data.fournisseur,
        cout_total_douane: data.cout_total_douane,
        cout_total_transport: data.cout_total_transport,
        cout_total_assurance: data.cout_total_assurance,
        cout_total_manutention: data.cout_total_manutention,
        devise: data.devise,
        statut: data.statut,
      }

      if (shipment) {
        const { error } = await supabase
          .from("shipments")
          .update(shipmentData)
          .eq("id_expedition", shipment.id_expedition)

        if (error) throw error

        toast.success("L'expédition a été modifiée avec succès")
      } else {
        const { error } = await supabase.from("shipments").insert(shipmentData)

        if (error) throw error

        toast.success("L'expédition a été créée avec succès")
      }

      onSaved()
    } catch (error) {
      console.error("[v0] Error saving shipment:", error)
      toast.error("Impossible de sauvegarder l'expédition")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shipment ? "Modifier l'expédition" : "Nouvelle expédition"}</DialogTitle>
          <DialogDescription>
            {shipment ? "Modifiez les informations de l'expédition" : "Créez une nouvelle expédition"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="costs">Coûts</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id_expedition">ID Expédition *</Label>
                  <Input
                    id="id_expedition"
                    {...register("id_expedition")}
                    placeholder="EXP-2025-001"
                    disabled={!!shipment}
                  />
                  {errors.id_expedition && <p className="text-sm text-destructive">{errors.id_expedition.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ref_conteneur">Référence conteneur *</Label>
                  <Input id="ref_conteneur" {...register("ref_conteneur")} placeholder="CONT-ABC-123" />
                  {errors.ref_conteneur && <p className="text-sm text-destructive">{errors.ref_conteneur.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fournisseur">Fournisseur *</Label>
                <Input id="fournisseur" {...register("fournisseur")} placeholder="Nom du fournisseur" />
                {errors.fournisseur && <p className="text-sm text-destructive">{errors.fournisseur.message}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date_depart">Date de départ *</Label>
                  <Input id="date_depart" type="date" {...register("date_depart")} />
                  {errors.date_depart && <p className="text-sm text-destructive">{errors.date_depart.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_reception">Date de réception</Label>
                  <Input id="date_reception" type="date" {...register("date_reception")} />
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
                      <SelectItem value="Préparation">Préparation</SelectItem>
                      <SelectItem value="En transit">En transit</SelectItem>
                      <SelectItem value="Réceptionnée">Réceptionnée</SelectItem>
                      <SelectItem value="Clôturée">Clôturée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="devise">Devise *</Label>
                  <Input id="devise" {...register("devise")} placeholder="EUR" />
                  {errors.devise && <p className="text-sm text-destructive">{errors.devise.message}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cout_total_transport">Coût transport *</Label>
                  <Input
                    id="cout_total_transport"
                    type="number"
                    step="0.01"
                    {...register("cout_total_transport")}
                    placeholder="0.00"
                  />
                  {errors.cout_total_transport && (
                    <p className="text-sm text-destructive">{errors.cout_total_transport.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cout_total_douane">Coût douane *</Label>
                  <Input
                    id="cout_total_douane"
                    type="number"
                    step="0.01"
                    {...register("cout_total_douane")}
                    placeholder="0.00"
                  />
                  {errors.cout_total_douane && (
                    <p className="text-sm text-destructive">{errors.cout_total_douane.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cout_total_assurance">Coût assurance *</Label>
                  <Input
                    id="cout_total_assurance"
                    type="number"
                    step="0.01"
                    {...register("cout_total_assurance")}
                    placeholder="0.00"
                  />
                  {errors.cout_total_assurance && (
                    <p className="text-sm text-destructive">{errors.cout_total_assurance.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cout_total_manutention">Coût manutention *</Label>
                  <Input
                    id="cout_total_manutention"
                    type="number"
                    step="0.01"
                    {...register("cout_total_manutention")}
                    placeholder="0.00"
                  />
                  {errors.cout_total_manutention && (
                    <p className="text-sm text-destructive">{errors.cout_total_manutention.message}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Coût total de l'expédition</span>
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
              {isSubmitting ? "Enregistrement..." : shipment ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
