"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  type Expense,
  type ExpenseStatus,
  fileToDataUrl,
  getExpense,
  submitExpense,
  upsertExpense,
} from "@/lib/expenses-store"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExpense } from "@/lib/expenses-store"

type Category = { id: string; name: string; threshold: number }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ExpenseForm({ expenseId }: { expenseId?: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const search = useSearchParams()
  const qId = expenseId || search.get("id") || undefined

  const { data: categories = [] } = useSWR<Category[]>("/api/categories", fetcher)
  const existing = useExpense(qId || undefined)

  const [form, setForm] = useState<{
    description: string
    category: string
    date: string
    amount: string
    currency: string
    attachments: File[]
    note: string
  }>({
    description: "",
    category: "",
    date: "",
    amount: "",
    currency: "USD",
    attachments: [],
    note: "",
  })

  // populate when editing
  useEffect(() => {
    if (existing.data) {
      const e = existing.data
      setForm({
        description: e.description,
        category: e.category,
        date: e.date.slice(0, 10),
        amount: String(e.amount),
        currency: e.currency,
        attachments: [],
        note: "",
      })
    }
  }, [existing.data])

  const amountNum = Number(form.amount || 0)
  const selectedCat = categories.find((c) => c.id === form.category)
  const exceeds = selectedCat && amountNum > selectedCat.threshold

  const errors = useMemo(() => {
    const errs: Record<string, string> = {}
    if (!form.description) errs.description = "Description is required"
    if (!form.category) errs.category = "Select a category"
    if (!form.date) errs.date = "Date is required"
    else if (new Date(form.date) > new Date()) errs.date = "Date cannot be in the future"
    if (!form.amount || Number(form.amount) <= 0) errs.amount = "Amount must be positive"
    if (!form.currency) errs.currency = "Currency is required"
    return errs
  }, [form])

  async function onSave(status: ExpenseStatus) {
    try {
      const id = qId ?? crypto.randomUUID()
      const attachments = await Promise.all(
        form.attachments.map(async (f) => ({
          id: crypto.randomUUID(),
          name: f.name,
          type: f.type,
          size: f.size,
          dataUrl: await fileToDataUrl(f),
        })),
      )
      const existingExpense = qId ? getExpense(qId) : undefined
      const base: Expense = existingExpense ?? {
        id,
        description: "",
        category: "",
        date: new Date().toISOString(),
        amount: 0,
        currency: "USD",
        attachments: [],
        status: "Draft",
        history: [],
      }

      const updated: Expense = {
        ...base,
        description: form.description,
        category: form.category,
        date: new Date(form.date).toISOString(),
        amount: Number(form.amount),
        currency: form.currency,
        attachments: attachments.length ? attachments : base.attachments,
        status,
      }

      upsertExpense(updated)
      if (status === "Pending") {
        submitExpense(updated.id, "You")
      }

      toast({ title: status === "Pending" ? "Submitted for approval" : "Saved as draft" })
      router.push("/expenses")
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to save", variant: "destructive" })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-4 lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              aria-invalid={!!errors.description}
            />
            {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}>
              <SelectTrigger aria-invalid={!!errors.category}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category}</p>}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              aria-invalid={!!errors.date}
            />
            {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date}</p>}
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                aria-invalid={!!errors.amount}
              />
              <Select value={form.currency} onValueChange={(v) => setForm((s) => ({ ...s, currency: v }))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.amount && <p className="mt-1 text-sm text-destructive">{errors.amount}</p>}
            {exceeds && (
              <div className="mt-2">
                <Badge variant="secondary">Warning</Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Amount exceeds recommended {selectedCat?.name} limit (${selectedCat?.threshold})
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="attachments">Attachments</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={(e) => {
                const files = e.currentTarget.files ? Array.from(e.currentTarget.files) : []
                setForm((s) => ({ ...s, attachments: files }))
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">Upload receipts or supporting documents.</p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => onSave("Draft")} variant="secondary">
            Save as Draft
          </Button>
          <Button onClick={() => onSave("Pending")} disabled={Object.keys(errors).length > 0}>
            Submit for Approval
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-medium">Status</h3>
        <div className="mt-2">
          <Badge variant="outline">{existing.data?.status ?? "Draft"}</Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Save as Draft to keep editing, or Submit for Approval to send to your manager.
        </p>
      </Card>
    </div>
  )
}
