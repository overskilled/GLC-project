"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Product } from "@/lib/types/product"

export function TopCostProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("statut", "Actif")
        .order("couts->total_revient", { ascending: false })
        .limit(5)

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error("[v0] Error loading top cost products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produits à coûts élevés</CardTitle>
        <CardDescription>Top 5 des produits avec les coûts de revient les plus élevés</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Aucun produit actif trouvé</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Coût de revient</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.nom}</TableCell>
                  <TableCell>
                    {product.categorie ? <Badge variant="outline">{product.categorie}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {product.couts.total_revient.toFixed(2)} {product.devise}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
