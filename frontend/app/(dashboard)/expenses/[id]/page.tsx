"use client"

import { useParams, useRouter } from "next/navigation"
import { approveExpense, rejectExpense, useExpense, mutateExpenses } from "@/lib/expenses-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: expense } = useExpense(id)
  const [openReject, setOpenReject] = useState(false)
  const [comment, setComment] = useState("")

  if (!expense) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{expense.description}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {expense.category} • {new Date(expense.date).toLocaleDateString()} • {expense.currency}{" "}
            {expense.amount.toFixed(2)}
          </p>
        </div>
        <Badge variant="outline">{expense.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2 space-y-3">
          <h3 className="font-semibold">Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Category</div>
            <div>{expense.category}</div>
            <div className="text-muted-foreground">Date</div>
            <div>{new Date(expense.date).toLocaleDateString()}</div>
            <div className="text-muted-foreground">Amount</div>
            <div>
              {expense.currency} {expense.amount.toFixed(2)}
            </div>
            <div className="text-muted-foreground">Attachments</div>
            <div className="space-y-2">
              {expense.attachments?.length ? (
                expense.attachments.map((a) => (
                  <a key={a.id} href={a.dataUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                    {a.name}
                  </a>
                ))
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Actions</h3>
          <div className="flex gap-2">
            <Button
              disabled={expense.status !== "Pending"}
              onClick={() => {
                approveExpense(expense.id)
                mutateExpenses()
                router.refresh()
              }}
            >
              Approve
            </Button>
            <Dialog open={openReject} onOpenChange={setOpenReject}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={expense.status !== "Pending"}>
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Expense</DialogTitle>
                </DialogHeader>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a mandatory comment..."
                />
                <DialogFooter>
                  <Button
                    variant="destructive"
                    disabled={!comment.trim()}
                    onClick={() => {
                      rejectExpense(expense.id, comment.trim())
                      mutateExpenses()
                      setOpenReject(false)
                      setComment("")
                      router.refresh()
                    }}
                  >
                    Confirm Reject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="pt-2">
            <h4 className="font-medium">Approval History</h4>
            <ol className="mt-2 space-y-2">
              {expense.history.map((h) => (
                <li key={h.step} className="text-sm">
                  <span className="font-medium">{h.decision}</span> by {h.actor}
                  {h.comment ? ` — ${h.comment}` : ""} • {new Date(h.at).toLocaleString()}
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>
    </section>
  )
}
