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
import type { Shipment } from "@/lib/types/shipment"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: Shipment | null
  onDeleted: () => void
}

export function DeleteShipmentDialog({ open, onOpenChange, shipment, onDeleted }: DeleteShipmentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handleDelete = async () => {
    if (!shipment) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("shipments").delete().eq("id_expedition", shipment.id_expedition)

      if (error) throw error

      toast.success("L'expédition a été supprimée avec succès")

      onDeleted()
    } catch (error) {
      console.error("[v0] Error deleting shipment:", error)
      toast("Impossible de supprimer l'expédition")
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
              <DialogTitle>Supprimer l'expédition</DialogTitle>
              <DialogDescription>Cette action est irréversible</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer l'expédition{" "}
            <span className="font-semibold">{shipment?.id_expedition}</span> ({shipment?.reference}) ?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tous les lots associés à cette expédition seront également affectés.
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
