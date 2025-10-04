export type ExpenseStatus = "Draft" | "Pending" | "Approved" | "Rejected"

export type Attachment = {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string // persistable for demo
}

export type Expense = {
  id: string
  description: string
  category: string
  date: string // ISO
  amount: number
  currency: string
  attachments: Attachment[]
  status: ExpenseStatus
  history: Array<{
    step: number
    actor: string
    decision: ExpenseStatus | "Submitted"
    comment?: string
    at: string // ISO
  }>
}

const STORAGE_KEY = "v0-demo-expenses"

function seedIfEmpty() {
  if (typeof window === "undefined") return
  const exists = localStorage.getItem(STORAGE_KEY)
  if (!exists) {
    const now = new Date()
    const iso = (d: Date) => d.toISOString()
    const data: Expense[] = [
      {
        id: "seed-1",
        description: "Client Lunch",
        category: "Meals",
        date: iso(new Date(now.getFullYear(), now.getMonth(), 4)),
        amount: 85.5,
        currency: "USD",
        attachments: [],
        status: "Approved",
        history: [
          {
            step: 1,
            actor: "Alice",
            decision: "Submitted",
            at: iso(new Date(now.getFullYear(), now.getMonth(), 4, 9)),
          },
          {
            step: 2,
            actor: "Manager",
            decision: "Approved",
            at: iso(new Date(now.getFullYear(), now.getMonth(), 5, 10)),
          },
        ],
      },
      {
        id: "seed-2",
        description: "Software Subscription",
        category: "Software",
        date: iso(new Date(now.getFullYear(), now.getMonth(), 6)),
        amount: 29.99,
        currency: "USD",
        attachments: [],
        status: "Approved",
        history: [
          {
            step: 1,
            actor: "Alice",
            decision: "Submitted",
            at: iso(new Date(now.getFullYear(), now.getMonth(), 6, 9)),
          },
          {
            step: 2,
            actor: "Manager",
            decision: "Approved",
            at: iso(new Date(now.getFullYear(), now.getMonth(), 7, 10)),
          },
        ],
      },
      {
        id: "seed-3",
        description: "Travel - Hotel history",
        category: "Travel",
        date: iso(new Date(now.getFullYear(), now.getMonth(), 10)),
        amount: 320.0,
        currency: "USD",
        attachments: [],
        status: "Rejected",
        history: [
          {
            step: 1,
            actor: "Alice",
            decision: "Submitted",
            at: iso(new Date(now.getFullYear(), now.getMonth(), 10, 9)),
          },
          {
            step: 2,
            actor: "Manager",
            decision: "Rejected",
            comment: "Missing receipt",
            at: iso(new Date(now.getFullYear(), now.getMonth(), 11, 11)),
          },
        ],
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

export function listExpenses(): Expense[] {
  if (typeof window === "undefined") return []
  seedIfEmpty()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Expense[]) : []
  } catch {
    return []
  }
}

export function getExpense(id: string): Expense | undefined {
  return listExpenses().find((e) => e.id === id)
}

export function upsertExpense(expense: Expense) {
  if (typeof window === "undefined") return
  const all = listExpenses()
  const idx = all.findIndex((e) => e.id === expense.id)
  if (idx >= 0) all[idx] = expense
  else all.unshift(expense)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function submitExpense(id: string, actor = "You") {
  const e = getExpense(id)
  if (!e) return
  e.status = "Pending"
  e.history.push({ step: e.history.length + 1, actor, decision: "Submitted", at: new Date().toISOString() })
  upsertExpense(e)
}

export function approveExpense(id: string, actor = "Manager") {
  const e = getExpense(id)
  if (!e) return
  e.status = "Approved"
  e.history.push({ step: e.history.length + 1, actor, decision: "Approved", at: new Date().toISOString() })
  upsertExpense(e)
}

export function rejectExpense(id: string, comment: string, actor = "Manager") {
  const e = getExpense(id)
  if (!e) return
  e.status = "Rejected"
  e.history.push({ step: e.history.length + 1, actor, decision: "Rejected", comment, at: new Date().toISOString() })
  upsertExpense(e)
}

export function pendingCount() {
  return listExpenses().filter((e) => e.status === "Pending").length
}

// SWR hooks
import useSWR, { mutate } from "swr"

const EXPENSES_KEY = "expenses:list"

export function useExpenses() {
  return useSWR<Expense[]>(EXPENSES_KEY, async () => listExpenses(), { revalidateOnFocus: true })
}

export function useExpense(id: string | undefined) {
  return useSWR<Expense | undefined>(
    id ? `${EXPENSES_KEY}:${id}` : null,
    async () => (id ? getExpense(id) : undefined),
    { revalidateOnFocus: false },
  )
}

export function mutateExpenses() {
  mutate(EXPENSES_KEY)
}

export function usePendingCount() {
  return useSWR<number>("expenses:pending-count", async () => pendingCount(), { revalidateOnFocus: true })
}

// helpers
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
