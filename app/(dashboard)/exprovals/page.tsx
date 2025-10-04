"use client"

import { useRouter } from "next/navigation"
import { approveExpense, mutateExpenses, rejectExpense, useExpenses } from "@/lib/expenses-store"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function ExprovalsPage() {
  const { data = [] } = useExpenses()
  const router = useRouter()
  const pending = data.filter((e) => e.status === "Pending")

  const [openId, setOpenId] = useState<string | null>(null)
  const [comment, setComment] = useState("")

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Approve or reject expense requests awaiting your review.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map((e) => (
              <TableRow key={e.id} className="cursor-pointer" onClick={() => router.push(`/expenses/${e.id}`)}>
                <TableCell className="font-medium">{e.description}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {e.currency} {e.amount.toFixed(2)}
                </TableCell>
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        approveExpense(e.id)
                        mutateExpenses()
                        router.refresh()
                      }}
                    >
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setOpenId(e.id)}>
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pending.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No pending approvals.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
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
                if (openId) {
                  rejectExpense(openId, comment.trim())
                  mutateExpenses()
                  setOpenId(null)
                  setComment("")
                  router.refresh()
                }
              }}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
