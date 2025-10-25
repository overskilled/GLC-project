"use client"

import { useEffect, useState } from "react"
import { Package, TrendingUp, Truck, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CostTrendChart } from "@/components/dashboard/cost-trend-chart"
import { TopCostProductsTable } from "@/components/dashboard/top-cost-products-table"
import { AlertsCard } from "@/components/dashboard/alerts-card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Product } from "@/lib/types/product"
import type { Shipment, Lot } from "@/lib/types/shipment"

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalShipments: number
  shipmentsInTransit: number
  totalStockValue: number
  averageCost: number
  totalLots: number
  lotsInStock: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalShipments: 0,
    shipmentsInTransit: 0,
    totalStockValue: 0,
    averageCost: 0,
    totalLots: 0,
    lotsInStock: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [productsResult, shipmentsResult, lotsResult] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("shipments").select("*"),
        supabase.from("physical_lots").select("*"),
      ])

      const products: Product[] = productsResult.data || []
      const shipments: Shipment[] = shipmentsResult.data || []
      const lots: Lot[] = lotsResult.data || []

      // Calculate statistics
      const activeProducts = products.filter((p) => p.statut === "Actif")
      const shipmentsInTransit = shipments.filter((s) => s.statut === "En transit")
      const lotsInStock = lots.filter((l) => l.statut === "En stock")

      const totalStockValue = lotsInStock.reduce((sum, lot) => sum + lot.prix_achat_unitaire * lot.quantite, 0)

      const averageCost =
        activeProducts.length > 0
          ? activeProducts.reduce((sum, p) => sum + p.couts.total_revient, 0) / activeProducts.length
          : 0

      setStats({
        totalProducts: products.length,
        activeProducts: activeProducts.length,
        totalShipments: shipments.length,
        shipmentsInTransit: shipmentsInTransit.length,
        totalStockValue,
        averageCost,
        totalLots: lots.length,
        lotsInStock: lotsInStock.length,
      })
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la gestion des coûts produits</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur du stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalStockValue.toFixed(2)} €</div>
                <p className="text-xs text-muted-foreground">{stats.lotsInStock} lots en stock</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeProducts}</div>
                <p className="text-xs text-muted-foreground">sur {stats.totalProducts} total</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expéditions en cours</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.shipmentsInTransit}</div>
                <p className="text-xs text-muted-foreground">{stats.totalShipments} expéditions total</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.averageCost.toFixed(2)} €</div>
                <p className="text-xs text-muted-foreground">coût de revient moyen</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Évolution des coûts</CardTitle>
            <CardDescription>Tendance des coûts de revient sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <CostTrendChart />
          </CardContent>
        </Card>

        <AlertsCard className="col-span-3" />
      </div>

      <TopCostProductsTable />
    </div>
  )
}
