"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
  /** tailwind bg token e.g., "bg-chart-3" or "bg-muted" */
  bg?: string
  icon?: ReactNode
  action?: { label: string; onClick?: () => void }
}

export function StatCard({ title, value, subtitle, bg = "bg-card", icon, action }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className={`p-0`}>
        <div className={`${bg} text-primary-foreground`}>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm/5 font-medium opacity-90">{title}</h3>
              <div className="opacity-90">{icon}</div>
            </div>
            <div className="mt-2 text-4xl font-semibold">{value}</div>
            {subtitle ? <p className="mt-1 text-sm/5 opacity-90">{subtitle}</p> : null}

            {action ? (
              <Button size="sm" variant="secondary" className="mt-4" onClick={action.onClick} aria-label={action.label}>
                {action.label}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
