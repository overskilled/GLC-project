"use client"

import { useEffect, useState } from "react"
import { DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Lot } from "@/lib/types/shipment"

export function StockValueCard() {
  const [stockValue, setStockValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadStockValue()
  }, [])

  const loadStockValue = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("physical_lots").select("*").eq("statut", "En stock")

      if (error) throw error

      const lots: Lot[] = data || []
      const totalValue = lots.reduce((sum, lot) => sum + lot.cout_achat_unitaire * lot.quantite_totale, 0)

      setStockValue(totalValue)
    } catch (error) {
      console.error("[v0] Error loading stock value:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
            <div className="text-2xl font-bold">{stockValue.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">valeur totale en stock</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
