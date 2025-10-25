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
import type { Lot } from "@/lib/types/shipment"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteLotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lot: Lot | null
  onDeleted: () => void
}

export function DeleteLotDialog({ open, onOpenChange, lot, onDeleted }: DeleteLotDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handleDelete = async () => {
    if (!lot) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("physical_lots").delete().eq("id_lot", lot.id_lot)

      if (error) throw error

      toast.success( "Le lot a été supprimé avec succès")

      onDeleted()
    } catch (error) {
      console.error("[v0] Error deleting lot:", error)
      toast.error( "Impossible de supprimer le lot")
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
              <DialogTitle>Supprimer le lot</DialogTitle>
              <DialogDescription>Cette action est irréversible</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer le lot <span className="font-semibold">{lot?.id_lot}</span> (
            {lot?.sku_physique}) ?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Toutes les données associées à ce lot seront définitivement supprimées.
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
