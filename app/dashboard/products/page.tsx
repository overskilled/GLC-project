"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { ProductDialog } from "@/components/products/product-dialog"
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Product } from "@/lib/types/product"
import { toast } from "sonner"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = products.filter(
        (product) =>
          product.nom.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.categorie?.toLowerCase().includes(query) ||
          product.barcode.toLowerCase().includes(query),
      )
      setFilteredProducts(filtered)
    }
  }, [searchQuery, products])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error) {
      console.error("[v0] Error loading products:", error)
      toast.error( "Impossible de charger les produits")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleProductSaved = () => {
    loadProducts()
    setIsDialogOpen(false)
    setSelectedProduct(null)
  }

  const handleProductDeleted = () => {
    loadProducts()
    setIsDeleteDialogOpen(false)
    setSelectedProduct(null)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Actif":
        return "default"
      case "Inactif":
        return "secondary"
      case "Archivé":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">Gérez votre catalogue de produits</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue produits</CardTitle>
          <CardDescription>Liste complète de vos produits avec leurs coûts de revient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, catégorie ou code-barres..."
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
                <p className="mt-2 text-sm text-muted-foreground">Chargement des produits...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>{searchQuery ? "Aucun produit trouvé" : "Aucun produit"}</EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "Essayez de modifier votre recherche"
                    : "Commencez par ajouter votre premier produit au catalogue"}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <Button onClick={handleAddProduct}>
                    <Plus className="h-4 w-4" />
                    Ajouter un produit
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Marque</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Coût de revient</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.nom}</TableCell>
                      <TableCell>
                        {product.categorie ? <Badge variant="outline">{product.categorie}</Badge> : "-"}
                      </TableCell>
                      <TableCell>{product.marque || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(product.statut)}>{product.statut}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.couts?.total_revient.toFixed(2)} {product.devise}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEditProduct(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteProduct(product)}
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

          {!isLoading && filteredProducts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} affiché
              {filteredProducts.length > 1 ? "s" : ""}
              {searchQuery && ` sur ${products.length} total`}
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        onSaved={handleProductSaved}
      />

      <DeleteProductDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        product={selectedProduct}
        onDeleted={handleProductDeleted}
      />
    </div>
  )
}
