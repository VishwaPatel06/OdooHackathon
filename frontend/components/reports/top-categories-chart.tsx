"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Row = { category: string; amount: number }

const defaultRows: Row[] = [
  { category: "Travel", amount: 3200 },
  { category: "Meals", amount: 1480 },
  { category: "Software", amount: 1320 },
  { category: "Supplies", amount: 860 },
  { category: "Training", amount: 540 },
]

const Currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export default function TopCategoriesChart({
  rows = defaultRows,
  height = 220,
}: {
  rows?: Row[]
  height?: number
}) {
  return (
    <div role="img" aria-label="Top categories bar chart" className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tickMargin={6}
            tickFormatter={(v: number) => Currency.format(v)}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            type="category"
            dataKey="category"
            axisLine={false}
            tickLine={false}
            width={96}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
            formatter={(value: number) => [Currency.format(value), "Amount"]}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="amount" radius={[6, 6, 6, 6]} fill={"hsl(var(--chart-2))"} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
