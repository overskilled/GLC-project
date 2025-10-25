"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { CostType } from "@/lib/types/cost-type"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteCostTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  costType: CostType | null
  onDeleted: () => void
}

export function DeleteCostTypeDialog({ open, onOpenChange, costType, onDeleted }: DeleteCostTypeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handleDelete = async () => {
    if (!costType) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("cost_types").delete().eq("id", costType.id)

      if (error) throw error

      toast.success("Le type de coût a été supprimé avec succès")

      onDeleted()
    } catch (error) {
      console.error("[v0] Error deleting cost type:", error)
      toast.error("Impossible de supprimer le type de coût")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Supprimer le type de coût</DialogTitle>
              <DialogDescription>Cette action est irréversible</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer le type de coût <span className="font-semibold">{costType?.nom}</span> (
            {costType?.code}) ?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce type de coût ne pourra plus être utilisé pour les nouveaux calculs.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
