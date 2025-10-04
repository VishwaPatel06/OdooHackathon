"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Point = { month: string; spend: number }

const defaultData: Point[] = [
  { month: "Jan", spend: 1250 },
  { month: "Feb", spend: 980 },
  { month: "Mar", spend: 1420 },
  { month: "Apr", spend: 1160 },
  { month: "May", spend: 1750 },
  { month: "Jun", spend: 1620 },
  { month: "Jul", spend: 1490 },
  { month: "Aug", spend: 1830 },
  { month: "Sep", spend: 1375 },
  { month: "Oct", spend: 1920 },
  { month: "Nov", spend: 1710 },
  { month: "Dec", spend: 2050 },
]

const Currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export default function MonthlySpendChart({
  data = defaultData,
  height = 220,
}: {
  data?: Point[]
  height?: number
}) {
  return (
    <div role="img" aria-label="Monthly spend area chart" className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={"hsl(var(--chart-1))"} stopOpacity={0.4} />
              <stop offset="95%" stopColor={"hsl(var(--chart-1))"} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            width={48}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => Currency.format(v).replace("$", "$")}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
            formatter={(value: number) => [Currency.format(value), "Spend"]}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            stroke={"hsl(var(--chart-1))"}
            fillOpacity={1}
            fill="url(#spendFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
