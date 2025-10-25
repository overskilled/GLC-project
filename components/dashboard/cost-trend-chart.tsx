"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts"

const data = [
  { month: "Jan", cost: 38.5, trend: "up" },
  { month: "Fév", cost: 39.2, trend: "up" },
  { month: "Mar", cost: 40.1, trend: "up" },
  { month: "Avr", cost: 41.3, trend: "up" },
  { month: "Mai", cost: 41.8, trend: "up" },
  { month: "Juin", cost: 42.35, trend: "up" },
]

// Color palette
const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(217, 91%, 60%)", // Blue
  success: "hsl(142, 76%, 36%)",   // Green
  warning: "hsl(38, 92%, 50%)",    // Amber
  error: "hsl(0, 84%, 60%)",       // Red
  muted: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
}

// Gradient definitions for the area under the line
const Gradient = () => (
  <defs>
    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3}/>
      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}/>
    </linearGradient>
    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.3}/>
      <stop offset="100%" stopColor={COLORS.success} stopOpacity={0}/>
    </linearGradient>
  </defs>
)

export function CostTrendChart() {
  const averageCost = data.reduce((sum, item) => sum + item.cost, 0) / data.length
  const maxCost = Math.max(...data.map(item => item.cost))
  const minCost = Math.min(...data.map(item => item.cost))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 px-6 justify-between items-center">
        {/* <div>
          <h3 className="text-lg font-semibold">Évolution des Coûts</h3>
          <p className="text-sm text-muted-foreground">
            Tendances mensuelles du coût moyen
          </p>
        </div> */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Coût actuel: {data[data.length - 1].cost}€</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span>Moyenne: {averageCost.toFixed(1)}€</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Gradient />
          <CartesianGrid 
            stroke={COLORS.grid} 
            strokeDasharray="3 3" 
            vertical={false}
            strokeOpacity={0.4}
          />
          <XAxis 
            dataKey="month" 
            stroke={COLORS.muted}
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            stroke={COLORS.muted}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}€`}
            domain={[minCost - 0.5, maxCost + 0.5]}
          />
          
          {/* Reference line for average */}
          <ReferenceLine 
            y={averageCost} 
            stroke={COLORS.muted}
            strokeDasharray="3 3"
            strokeOpacity={0.7}
            label={{
              value: `Moyenne ${averageCost.toFixed(1)}€`,
              position: 'right',
              fill: COLORS.muted,
              fontSize: 10,
            }}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const isPeak = data.cost === maxCost
                const isLow = data.cost === minCost
                
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS.primary }}
                        />
                        <span className="font-semibold">{data.month}</span>
                        {isPeak && (
                          <span className="px-2 py-1 text-xs rounded-full bg-warning/20 text-warning-foreground">
                            Pic
                          </span>
                        )}
                        {isLow && (
                          <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success-foreground">
                            Bas
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase text-muted-foreground">Coût</span>
                          <span className="font-bold text-lg" style={{ color: COLORS.primary }}>
                            {payload[0].value}€
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase text-muted-foreground">Vs Moyenne</span>
                          <span 
                            className={`font-semibold ${
                              data.cost > averageCost ? 'text-error' : 'text-success'
                            }`}
                          >
                            {data.cost > averageCost ? '+' : ''}{(data.cost - averageCost).toFixed(1)}€
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          
          {/* Main cost line */}
          <Line 
            type="monotone" 
            dataKey="cost" 
            stroke={COLORS.primary}
            strokeWidth={3}
            dot={({ cx, cy, payload }) => {
              const isPeak = payload.cost === maxCost
              const isLow = payload.cost === minCost
              
              return (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={isPeak || isLow ? 6 : 4}
                  fill={isPeak ? COLORS.warning : isLow ? COLORS.success : COLORS.primary}
                  stroke={isPeak ? COLORS.warning : isLow ? COLORS.success : "#fff"}
                  strokeWidth={2}
                />
              )
            }}
            activeDot={{ 
              r: 8, 
              fill: COLORS.primary,
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Trend indicators */}
      <div className="flex justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span>Plus bas: {minCost}€</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span>Plus haut: {maxCost}€</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Croissance: +{(maxCost - minCost).toFixed(2)}€</span>
        </div>
      </div>
    </div>
  )
}