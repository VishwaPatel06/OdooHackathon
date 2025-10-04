import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileCheck2, ReceiptText } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <section>
      {/* Page Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-pretty">Dashboard</h1>

      {/* Welcome pill */}
      <div className="mt-3">
        <span className="inline-flex items-center rounded-md bg-secondary px-3 py-1 text-sm">
          Welcome, [User Name]!
        </span>
      </div>

      {/* Notes */}
      <ul className="mt-5 space-y-2 text-sm leading-6">
        <li className="list-disc list-inside">A spenage can and cbrial roles — Employee Manager.</li>
        <li className="list-disc list-inside">Des tira joot ornures</li>
      </ul>

      {/* Divider */}
      <div className="my-6 h-px bg-border" />

      {/* Section label */}
      <div className="mb-4">
        <span className="inline-flex items-center rounded-md bg-secondary px-3 py-1 text-sm">Recent Activity</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="My Expenses"
          value="5"
          subtitle="Total: $1,250.00"
          bg="bg-chart-3"
          icon={<ReceiptText className="size-6" />}
          action={{ label: "New Expense" }}
        />
        <StatCard
          title="Pending Approvals"
          value="12"
          subtitle="Total: $6,900.00"
          bg="bg-chart-2"
          icon={<FileCheck2 className="size-6" />}
          action={{ label: "View Approvals" }}
        />
        <Card>
          <CardContent className="p-5">
            <div className="text-sm font-medium text-muted-foreground">Quick Actions</div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <Link href="/scan-ocr">Scan with OCR</Link>
              </Button>
              <Button variant="outline" className="justify-start bg-transparent">
                Check Exchange Rates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table header label */}
      <div className="mt-8 mb-3">
        <span className="inline-flex items-center rounded-md bg-secondary px-3 py-1 text-sm">Recent Activity</span>
      </div>

      {/* Recent Activity Table */}
      <div className="overflow-hidden rounded-md border">
        <div className="grid grid-cols-12 bg-muted px-3 py-2 text-sm font-medium">
          <div className="col-span-4">Date</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right pr-1">View/Edit</div>
        </div>
        {[
          { date: "Client Lunch", description: "$85.50", status: "Approved" },
          { date: "Software Subscription", description: "$29.99", status: "Approved" },
          { date: "Travel - Hotel  history", description: "—", status: "Rejected" },
        ].map((row, i) => (
          <div key={i} className="grid grid-cols-12 border-t px-3 py-3 text-sm items-center">
            <div className="col-span-4">{row.date}</div>
            <div className="col-span-4">{row.description}</div>
            <div className="col-span-2">
              <Badge variant={row.status === "Approved" ? "default" : "secondary"}>{row.status}</Badge>
            </div>
            <div className="col-span-2 text-right">
              <Button size="sm" variant="ghost">
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
