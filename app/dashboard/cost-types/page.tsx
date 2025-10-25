"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { CostTypeDialog } from "@/components/cost-types/cost-type-dialog"
import { DeleteCostTypeDialog } from "@/components/cost-types/delete-cost-type-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { CostType } from "@/lib/types/cost-type"
import { useAuthStore } from "@/lib/store/auth-store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function CostTypesPage() {
  const [costTypes, setCostTypes] = useState<CostType[]>([])
  const [filteredCostTypes, setFilteredCostTypes] = useState<CostType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCostType, setSelectedCostType] = useState<CostType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (user?.role !== "admin") {
      toast.error("Cette section est réservée aux administrateurs")
      router.push("/dashboard")
      return
    }
    loadCostTypes()
  }, [user])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCostTypes(costTypes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = costTypes.filter(
        (costType) =>
          costType.nom.toLowerCase().includes(query) ||
          costType.code.toLowerCase().includes(query) ||
          costType.categorie.toLowerCase().includes(query),
      )
      setFilteredCostTypes(filtered)
    }
  }, [searchQuery, costTypes])

  const loadCostTypes = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("cost_types").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setCostTypes(data || [])
      setFilteredCostTypes(data || [])
    } catch (error) {
      console.error("[v0] Error loading cost types:", error)
      toast.error("Impossible de charger les types de coûts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCostType = () => {
    setSelectedCostType(null)
    setIsDialogOpen(true)
  }

  const handleEditCostType = (costType: CostType) => {
    setSelectedCostType(costType)
    setIsDialogOpen(true)
  }

  const handleDeleteCostType = (costType: CostType) => {
    setSelectedCostType(costType)
    setIsDeleteDialogOpen(true)
  }

  const handleCostTypeSaved = () => {
    loadCostTypes()
    setIsDialogOpen(false)
    setSelectedCostType(null)
  }

  const handleCostTypeDeleted = () => {
    loadCostTypes()
    setIsDeleteDialogOpen(false)
    setSelectedCostType(null)
  }

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case "Direct":
        return "default"
      case "Indirect":
        return "secondary"
      case "Fixe":
        return "outline"
      case "Variable":
        return "outline"
      default:
        return "outline"
    }
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Types de coûts</h1>
          <p className="text-muted-foreground">Gérez les catégories de coûts pour vos produits</p>
        </div>
        <Button onClick={handleAddCostType}>
          <Plus className="h-4 w-4" />
          Ajouter un type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Types de coûts configurés</CardTitle>
          <CardDescription>Liste des types de coûts disponibles pour le calcul des coûts de revient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, code ou catégorie..."
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
                <p className="mt-2 text-sm text-muted-foreground">Chargement des types de coûts...</p>
              </div>
            </div>
          ) : filteredCostTypes.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DollarSign />
                </EmptyMedia>
                <EmptyTitle>{searchQuery ? "Aucun type trouvé" : "Aucun type de coût"}</EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "Essayez de modifier votre recherche"
                    : "Commencez par ajouter votre premier type de coût"}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <Button onClick={handleAddCostType}>
                    <Plus className="h-4 w-4" />
                    Ajouter un type
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Unité de calcul</TableHead>
                    <TableHead>Taux par défaut</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCostTypes.map((costType) => (
                    <TableRow key={costType.id}>
                      <TableCell className="font-mono text-sm">{costType.code}</TableCell>
                      <TableCell className="font-medium">{costType.nom}</TableCell>
                      <TableCell>
                        <Badge variant={getCategoryVariant(costType.categorie)}>{costType.categorie}</Badge>
                      </TableCell>
                      <TableCell>{costType.unite_calcul || "-"}</TableCell>
                      <TableCell>{costType.taux_defaut ? `${costType.taux_defaut}%` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={costType.actif ? "default" : "secondary"}>
                          {costType.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEditCostType(costType)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteCostType(costType)}
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

          {!isLoading && filteredCostTypes.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredCostTypes.length} type{filteredCostTypes.length > 1 ? "s" : ""} affiché
              {filteredCostTypes.length > 1 ? "s" : ""}
              {searchQuery && ` sur ${costTypes.length} total`}
            </div>
          )}
        </CardContent>
      </Card>

      <CostTypeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        costType={selectedCostType}
        onSaved={handleCostTypeSaved}
      />

      <DeleteCostTypeDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        costType={selectedCostType}
        onDeleted={handleCostTypeDeleted}
      />
    </div>
  )
}
