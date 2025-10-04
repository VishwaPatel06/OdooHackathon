export default function AnalyticsPage() {
  return (
    <section>
      <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
      <p className="mt-2 text-sm text-muted-foreground">High-level KPIs for finance operations.</p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          ["Total Spend (YTD)", "$82,400"],
          ["Avg. Expense", "$74.33"],
          ["Approval Rate", "92%"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border p-4">
            <div className="text-sm font-medium">{label}</div>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
