"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Lot } from "@/lib/types/shipment"

interface Alert {
  id: string
  type: "warning" | "error" | "info"
  title: string
  description: string
}

export function AlertsCard({ className }: { className?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setIsLoading(true)
    try {
      const generatedAlerts: Alert[] = []

      // Check for low stock
      const { data: lots } = await supabase.from("physical_lots").select("*").eq("statut", "En stock")

      const lotsData: Lot[] = lots || []
      const lowStockCount = lotsData.filter((lot) => lot.quantite < 10).length

      if (lowStockCount > 0) {
        generatedAlerts.push({
          id: "low-stock",
          type: "warning",
          title: "Stock faible",
          description: `${lowStockCount} lot${lowStockCount > 1 ? "s" : ""} avec quantité faible`,
        })
      }

      // Check for expiring lots
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const expiringLots = lotsData.filter((lot) => {
        if (!lot.date_peremption) return false
        const expiryDate = new Date(lot.date_peremption)
        return expiryDate <= thirtyDaysFromNow && expiryDate > now
      })

      if (expiringLots.length > 0) {
        generatedAlerts.push({
          id: "expiring",
          type: "error",
          title: "Péremption proche",
          description: `${expiringLots.length} lot${expiringLots.length > 1 ? "s" : ""} expire${expiringLots.length > 1 ? "nt" : ""} dans 30 jours`,
        })
      }

      // Check for recent shipments
      const { data: shipments } = await supabase
        .from("shipments")
        .select("*")
        .eq("statut", "Réceptionnée")
        .order("date_reception", { ascending: false })
        .limit(5) // Limit to 5 most recent shipments

      if (shipments && shipments.length > 0) {
        // Map shipments to alerts
        const shipmentAlerts = shipments.map((shipment: any, index: number) => ({
          id: `recent-shipment-${shipment.id || index}`,
          type: "info" as const,
          title: "Expédition reçue",
          description: `${shipment.reference} réceptionnée`,
          timestamp: shipment.date_reception,
          priority: index === 0 ? "high" : "medium", // Most recent gets higher priority
          metadata: {
            reference: shipment.reference,
            receptionDate: shipment.date_reception,
            shipmentId: shipment.id
          }
        }))

        generatedAlerts.push(...shipmentAlerts)
      }

      // Check for inactive products
      const { data: products } = await supabase.from("products").select("*").eq("statut", "Inactif")

      const inactiveCount = (products || []).length
      if (inactiveCount > 0) {
        generatedAlerts.push({
          id: "inactive-products",
          type: "info",
          title: "Produits inactifs",
          description: `${inactiveCount} produit${inactiveCount > 1 ? "s" : ""} inactif${inactiveCount > 1 ? "s" : ""}`,
        })
      }

      setAlerts(generatedAlerts.slice(0, 3))
    } catch (error) {
      console.error("[v0] Error loading alerts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Alertes</CardTitle>
        <CardDescription>Notifications importantes</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Aucune alerte pour le moment</div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-full p-1",
                    alert.type === "error" && "bg-destructive/10 text-destructive",
                    alert.type === "warning" && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
                    alert.type === "info" && "bg-blue-500/10 text-blue-600 dark:text-blue-500",
                  )}
                >
                  {alert.type === "error" && <AlertCircle className="h-4 w-4" />}
                  {alert.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                  {alert.type === "info" && <Info className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
