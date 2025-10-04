import Link from "next/link"
import { Button } from "@/components/ui/button"
import ExpenseTable from "@/components/expenses/expense-table"

export default function ExpensesPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and track your expense submissions.</p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">New Expense</Link>
        </Button>
      </div>

      <ExpenseTable />
    </section>
  )
}
