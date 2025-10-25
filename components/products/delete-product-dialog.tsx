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
import type { Product } from "@/lib/types/product"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onDeleted: () => void
}

export function DeleteProductDialog({ open, onOpenChange, product, onDeleted }: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handleDelete = async () => {
    if (!product) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id)

      if (error) throw error

      toast.success("Le produit a été supprimé avec succès")

      onDeleted()
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      toast.error("Impossible de supprimer le produit")
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
              <DialogTitle>Supprimer le produit</DialogTitle>
              <DialogDescription>Cette action est irréversible</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer le produit <span className="font-semibold">{product?.nom}</span> (
            {product?.sku}) ?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Toutes les données associées à ce produit seront définitivement supprimées.
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
