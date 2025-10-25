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
import { Checkbox } from "@/components/ui/checkbox"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { CostType } from "@/lib/types/cost-type"
import { Textarea } from "@/components/ui/textarea"

const costTypeSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  code: z.string().min(1, "Code requis"),
  description: z.string().optional(),
  categorie: z.enum(["Direct", "Indirect", "Fixe", "Variable"]),
  unite_calcul: z.string().optional(),
  taux_defaut: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).max(100).optional(),
  ),
  actif: z.boolean(),
})

type CostTypeFormValues = z.infer<typeof costTypeSchema>

interface CostTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  costType: CostType | null
  onSaved: () => void
}

export function CostTypeDialog({ open, onOpenChange, costType, onSaved }: CostTypeDialogProps) {
  const supabase = getSupabaseBrowserClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CostTypeFormValues>({
    resolver: zodResolver(costTypeSchema),
    defaultValues: {
      nom: "",
      code: "",
      description: "",
      categorie: "Direct",
      unite_calcul: "",
      taux_defaut: undefined,
      actif: true,
    },
  })

  useEffect(() => {
    if (costType) {
      reset({
        nom: costType.nom,
        code: costType.code,
        description: costType.description || "",
        categorie: costType.categorie,
        unite_calcul: costType.unite_calcul || "",
        taux_defaut: costType.taux_defaut,
        actif: costType.actif,
      })
    } else {
      reset({
        nom: "",
        code: "",
        description: "",
        categorie: "Direct",
        unite_calcul: "",
        taux_defaut: undefined,
        actif: true,
      })
    }
  }, [costType, reset])

  const onSubmit = async (data: CostTypeFormValues) => {
    try {
      const costTypeData = {
        nom: data.nom,
        code: data.code,
        description: data.description || null,
        categorie: data.categorie,
        unite_calcul: data.unite_calcul || null,
        taux_defaut: data.taux_defaut || null,
        actif: data.actif,
      }

      if (costType) {
        const { error } = await supabase.from("cost_types").update(costTypeData).eq("id", costType.id)

        if (error) throw error

        toast({
          title: "Type de coût modifié",
          description: "Le type de coût a été modifié avec succès",
        })
      } else {
        const { error } = await supabase.from("cost_types").insert(costTypeData)

        if (error) throw error

        toast({
          title: "Type de coût ajouté",
          description: "Le type de coût a été ajouté avec succès",
        })
      }

      onSaved()
    } catch (error) {
      console.error("[v0] Error saving cost type:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le type de coût",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{costType ? "Modifier le type de coût" : "Ajouter un type de coût"}</DialogTitle>
          <DialogDescription>
            {costType
              ? "Modifiez les informations du type de coût"
              : "Ajoutez un nouveau type de coût pour le calcul des coûts de revient"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={() => onSubmit()} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" {...register("code")} placeholder="TRANS" />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" {...register("nom")} placeholder="Transport" />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description du type de coût"
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie *</Label>
              <Select onValueChange={(value) => setValue("categorie", value as any)} defaultValue={watch("categorie")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Indirect">Indirect</SelectItem>
                  <SelectItem value="Fixe">Fixe</SelectItem>
                  <SelectItem value="Variable">Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unite_calcul">Unité de calcul</Label>
              <Input id="unite_calcul" {...register("unite_calcul")} placeholder="kg, km, unité..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taux_defaut">Taux par défaut (%)</Label>
            <Input
              id="taux_defaut"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("taux_defaut")}
              placeholder="0.00"
            />
            {errors.taux_defaut && <p className="text-sm text-destructive">{errors.taux_defaut.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="actif" checked={watch("actif")} onCheckedChange={(checked) => setValue("actif", !!checked)} />
            <Label htmlFor="actif" className="text-sm font-normal cursor-pointer">
              Type de coût actif
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : costType ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
