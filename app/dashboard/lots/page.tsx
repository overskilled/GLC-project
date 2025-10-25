"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, Box, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { LotDialog } from "@/components/lots/lot-dialog"
import { DeleteLotDialog } from "@/components/lots/delete-lot-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Lot } from "@/lib/types/shipment"
import type { Product } from "@/lib/types/product"
import { toast } from "sonner"

interface LotWithProduct extends Lot {
  product?: Product
  numero_lot?: string 
  shipments: any
  products: any
}

export default function LotsPage() {
  const [lots, setLots] = useState<LotWithProduct[]>([])
  const [filteredLots, setFilteredLots] = useState<LotWithProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLot, setSelectedLot] = useState<LotWithProduct | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadLots()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLots(lots)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = lots.filter(
        (lot) =>
          lot.id.toLowerCase().includes(query) ||
          lot.sku_physique.toLowerCase().includes(query) ||
          lot.id_expedition.toLowerCase().includes(query) ||
          lot.product?.nom.toLowerCase().includes(query) ||
          lot.statut.toLowerCase().includes(query),
      )
      setFilteredLots(filtered)
    }
  }, [searchQuery, lots])

  const loadLots = async () => {
    setIsLoading(true)
    try {
      const { data: lotsData, error: lotsError } = await supabase
        .from("physical_lots")
        .select(`
          *,
          products (id, sku, nom),
          shipments (id, reference, cout_total)
        `)
        .order("id_lot", { ascending: false });


      if (lotsError) throw lotsError

      const { data: productsData, error: productsError } = await supabase.from("products").select("*")

      if (productsError) throw productsError

      const lotsWithProducts = (lotsData || []).map((lot: any) => ({
        ...lot,
        product: productsData?.find((p: any) => p.id === lot.id_produit),
      }))

      setLots(lotsWithProducts)
      setFilteredLots(lotsWithProducts)
    } catch (error) {
      console.error("[v0] Error loading lots:", error)
      toast.error("Impossible de charger les lots")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLot = () => {
    setSelectedLot(null)
    setIsDialogOpen(true)
  }

  const handleEditLot = (lot: LotWithProduct) => {
    setSelectedLot(lot)
    setIsDialogOpen(true)
  }

  const handleDeleteLot = (lot: LotWithProduct) => {
    setSelectedLot(lot)
    setIsDeleteDialogOpen(true)
  }

  const handleLotSaved = () => {
    loadLots()
    setIsDialogOpen(false)
    setSelectedLot(null)
  }

  const handleLotDeleted = () => {
    loadLots()
    setIsDeleteDialogOpen(false)
    setSelectedLot(null)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "En stock":
        return "default"
      case "Épuisé":
        return "secondary"
      case "Supprimé":
        return "outline"
      default:
        return "outline"
    }
  }

  const totalStock = lots.filter((l) => l.statut === "En stock").reduce((sum, l) => sum + l.quantite, 0)
  const totalValue = lots
    .filter((l) => l.statut === "En stock")
    .reduce((sum, l) => sum + l.prix_achat_unitaire * l.quantite, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lots physiques</h1>
          <p className="text-muted-foreground">Gérez vos lots de produits et leur allocation de coûts</p>
        </div>
        <Button onClick={handleAddLot}>
          <Plus className="h-4 w-4" />
          Nouveau lot
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total lots</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lots.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lots.filter((l) => l.statut === "En stock").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantité totale</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des lots</CardTitle>
          <CardDescription>Suivez vos lots physiques et leurs coûts alloués</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID lot, SKU, expédition ou produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-2 text-sm text-muted-foreground">Chargement des lots...</p>
              </div>
            </div>
          ) : filteredLots.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Box />
                </EmptyMedia>
                <EmptyTitle>{searchQuery ? "Aucun lot trouvé" : "Aucun lot"}</EmptyTitle>
                <EmptyDescription>
                  {searchQuery ? "Essayez de modifier votre recherche" : "Commencez par créer votre premier lot"}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <Button onClick={handleAddLot}>
                    <Plus className="h-4 w-4" />
                    Nouveau lot
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero du Lot</TableHead>
                    <TableHead>SKU Physique</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Expédition</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Coût unitaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-mono text-sm">{lot.numero_lot}</TableCell>
                      <TableCell className="font-medium">{lot.products?.sku}</TableCell>
                      <TableCell>{lot.product?.nom || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{lot.shipments?.reference}</TableCell>
                      <TableCell className="text-right">{lot.quantite}</TableCell>
                      <TableCell className="text-right font-semibold">{lot?.prix_achat_unitaire?.toFixed(2)} €</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(lot.statut)}>{lot.statut}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEditLot(lot)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteLot(lot)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filteredLots.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredLots.length} lot{filteredLots.length > 1 ? "s" : ""} affiché{filteredLots.length > 1 ? "s" : ""}
              {searchQuery && ` sur ${lots.length} total`}
            </div>
          )}
        </CardContent>
      </Card>

      <LotDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} lot={selectedLot} onSaved={handleLotSaved} />

      <DeleteLotDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        lot={selectedLot}
        onDeleted={handleLotDeleted}
      />
    </div>
  )
}
