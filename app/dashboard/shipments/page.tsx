"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { ShipmentDialog } from "@/components/shipments/shipment-dialog"
import { DeleteShipmentDialog } from "@/components/shipments/delete-shipment-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Shipment } from "@/lib/types/shipment"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadShipments()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredShipments(shipments)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = shipments.filter(
        (shipment) =>
          shipment?.id_expedition.toLowerCase().includes(query) ||
          shipment.reference.toLowerCase().includes(query) ||
          shipment.fournisseur.toLowerCase().includes(query) ||
          shipment.statut.toLowerCase().includes(query),
      )
      setFilteredShipments(filtered)
    }
  }, [searchQuery, shipments])

  const loadShipments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("shipments").select("*").order("date_depart", { ascending: false })

      if (error) throw error

      setShipments(data || [])
      setFilteredShipments(data || [])
    } catch (error) {
      console.error("[v0] Error loading shipments:", error)
      toast.error("Impossible de charger les expéditions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddShipment = () => {
    setSelectedShipment(null)
    setIsDialogOpen(true)
  }

  const handleEditShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setIsDialogOpen(true)
  }

  const handleDeleteShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setIsDeleteDialogOpen(true)
  }

  const handleShipmentSaved = () => {
    loadShipments()
    setIsDialogOpen(false)
    setSelectedShipment(null)
  }

  const handleShipmentDeleted = () => {
    loadShipments()
    setIsDeleteDialogOpen(false)
    setSelectedShipment(null)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Préparation":
        return "secondary"
      case "En transit":
        return "default"
      case "Réceptionnée":
        return "outline"
      case "Clôturée":
        return "outline"
      default:
        return "outline"
    }
  }

  const getTotalCost = (shipment: Shipment) => {
    return (
      shipment.cout_total_douane +
      shipment.cout_total_transport +
      shipment.cout_total_assurance +
      shipment.cout_total_manutention
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expéditions</h1>
          <p className="text-muted-foreground">Gérez vos expéditions et leurs coûts associés</p>
        </div>
        <Button onClick={handleAddShipment}>
          <Plus className="h-4 w-4" />
          Nouvelle expédition
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total expéditions</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.filter((s) => s.statut === "En transit").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réceptionnées</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.filter((s) => s.statut === "Réceptionnée").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût total</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* {shipments.reduce((sum, s) => sum + getTotalCost(s), 0).toFixed(2)} € */}
              {shipments.reduce(((sum, s) => sum + s.cout_total), 0).toFixed(2)} €
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des expéditions</CardTitle>
          <CardDescription>Suivez vos expéditions et leurs coûts logistiques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, conteneur, fournisseur ou statut..."
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
                <p className="mt-2 text-sm text-muted-foreground">Chargement des expéditions...</p>
              </div>
            </div>
          ) : filteredShipments.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Truck />
                </EmptyMedia>
                <EmptyTitle>{searchQuery ? "Aucune expédition trouvée" : "Aucune expédition"}</EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "Essayez de modifier votre recherche"
                    : "Commencez par créer votre première expédition"}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <Button onClick={handleAddShipment}>
                    <Plus className="h-4 w-4" />
                    Nouvelle expédition
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead>ID Expédition</TableHead> */}
                    <TableHead>Reference</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date départ</TableHead>
                    <TableHead>Date réception</TableHead>
                    <TableHead>Statut</TableHead>
                    {/* <TableHead className="text-right">Coût de transport</TableHead>
                    <TableHead className="text-right">Coût de douane</TableHead>
                    <TableHead className="text-right">Coût d'assurance</TableHead>
                    <TableHead className="text-right">Coût manutention</TableHead> */}
                    <TableHead className="text-right">Coût total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id_expedition}>
                      {/* <TableCell className="font-mono text-sm">{shipment.id_expedition}</TableCell> */}
                      <TableCell className="font-medium">{shipment.reference}</TableCell>
                      <TableCell>{shipment.fournisseur}</TableCell>
                      <TableCell>{format(new Date(shipment.date_depart), "dd MMM yyyy", { locale: fr })}</TableCell>
                      <TableCell>
                        {shipment.date_reception
                          ? format(new Date(shipment.date_reception), "dd MMM yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(shipment.statut)}>{shipment.statut}</Badge>
                      </TableCell>
                      {/* <TableCell className="text-right font-semibold">
                        {shipment.cout_transport.toFixed(2)} {shipment.devise || "€"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {shipment.cout_douane.toFixed(2)} {shipment.devise || "€"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {shipment.cout_assurance.toFixed(2)} {shipment.devise || "€"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {shipment.cout_manutention.toFixed(2)} {shipment.devise || "€"}
                      </TableCell> */}
                      <TableCell className="text-right font-semibold">
                        {shipment.cout_total.toFixed(2)} {shipment.devise || "€"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEditShipment(shipment)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteShipment(shipment)}
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

          {!isLoading && filteredShipments.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredShipments.length} expédition{filteredShipments.length > 1 ? "s" : ""} affichée
              {filteredShipments.length > 1 ? "s" : ""}
              {searchQuery && ` sur ${shipments.length} total`}
            </div>
          )}
        </CardContent>
      </Card>

      <ShipmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        shipment={selectedShipment}
        onSaved={handleShipmentSaved}
      />

      <DeleteShipmentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        shipment={selectedShipment}
        onDeleted={handleShipmentDeleted}
      />
    </div>
  )
}
