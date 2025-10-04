import MonthlySpendChart from "@/components/reports/monthly-spend-chart"
import TopCategoriesChart from "@/components/reports/top-categories-chart"

export default function ReportsPage() {
  return (
    <section>
      <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
      <p className="mt-2 text-sm text-muted-foreground">View spend reports and export data.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border p-4">
          <div className="text-sm font-medium">Monthly Spend</div>
          <div className="mt-3">
            <MonthlySpendChart />
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm font-medium">Top Categories</div>
          <div className="mt-3">
            <TopCategoriesChart />
          </div>
        </div>
      </div>
    </section>
  )
}
