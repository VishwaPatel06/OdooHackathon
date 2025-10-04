import ExpenseForm from "@/components/expenses/expense-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewExpensePage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">New Expense</h1>
        <Button asChild variant="ghost">
          <Link href="/expenses">Back to Expenses</Link>
        </Button>
      </div>
      <ExpenseForm />
    </section>
  )
}
